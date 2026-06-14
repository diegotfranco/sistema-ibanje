# Runbooks — Sistema Ibanje

Incident playbooks for the solo operator. Each is **symptom → diagnose → fix**. Deploy/restore
mechanics live in [DEPLOY.md](./DEPLOY.md); this file is what you reach for when something is _wrong_.

All commands assume you're in `/opt/sistema-ibanje/app`. Shorthand used below:

```sh
dc() { docker compose -f docker-compose.prod.yml --env-file .env.production "$@"; }
```

---

## 1. Nobody can log in

**Symptoms:** login returns 500/503, or sessions don't stick (you log in and are immediately bounced
back to `/login`), or every request 401s. Most often this is **Redis** — sessions and the login
lockout counter live there, so if Redis is down, no session can be created or read.

**Diagnose**

```sh
dc ps                          # is `redis` up and healthy?
dc logs --tail=50 redis
dc logs --tail=50 api          # look for ECONNREFUSED / "redis" / session-store errors
dc exec redis redis-cli ping   # expect: PONG
```

**Fix**

- **Redis container down / unhealthy:** `dc up -d redis`, then `dc restart api`. Sessions are
  ephemeral — everyone simply logs in again. No data loss (Redis holds only sessions + transient
  counters, never church data).
- **Redis up but `api` can't reach it:** confirm `REDIS_URL` in `.env.production` points at the
  `redis` service host, then `dc restart api`.
- **A user is locked out after failed attempts** (soft lockout, 5 fails → 15-min window): it clears
  itself after the window or on a correct login. To clear immediately:
  `dc exec redis redis-cli --scan --pattern 'login:fail:*'` then `DEL` the relevant key.
- **Admin forgot their password and no other admin exists:** reset via the DB — issue a reset token
  through the app's "forgot password" flow if email works; otherwise see the user table directly.
  Never hand-edit `password_hash` to a plaintext value — it's Argon2id + pepper.

If login works but email-based flows (invite/reset) don't, that's Resend, not Redis — check
`dc logs api` for `Resend rejected` / `Failed to send` and verify `RESEND_API_KEY`.

---

## 2. Restore from backup (data loss / corruption / bad migration)

**Symptoms:** data is gone or wrong, or a migration corrupted the schema and rolling the code back
isn't enough.

**Diagnose first — don't restore reflexively.** A restore overwrites everything since the last nightly
dump (02:00 UTC). Confirm the damage is real and worse than losing today's entries before proceeding.

**Fix:** follow **[DEPLOY.md → Restore from backup](./DEPLOY.md#restore-from-backup)**. In short:
list backups in the `backup` container, `mc cp` the chosen `YYYY-MM-DD.sql.gz`, then pipe it through
`psql` (the dump is `--clean --if-exists`, so it drops and recreates). Take a _fresh_ dump of the
current broken state first — it's evidence, and occasionally the "broken" DB still has rows the old
backup lacks.

**After any restore:** run `scripts/verify-backup.sh` mentally in reverse — log in, open the
dashboard, spot-check the latest finance entries and the audit page (`/configuracoes/auditoria`) to
confirm the trail is intact.

---

## 3. A migration went wrong

**Symptoms:** `pnpm db:migrate` errored partway, or the app crashes on boot after a deploy that
included schema changes.

**Diagnose**

```sh
dc logs --tail=80 api          # schema/column errors? which migration?
dc exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"   # eyeball the tables
```

**Fix** — migrations are **forward-only** (see [DEPLOY.md → Database migrations & rollback policy](./DEPLOY.md#database-migrations--rollback-policy)):

1. **If you took the pre-migration snapshot** (you should have — it's in the policy): restore it
   (Runbook 2), check out the previous release tag, rebuild, and bring the stack up on the old code.
   Then fix the migration on a branch and redeploy deliberately.
2. **If you have no snapshot:** do not improvise `DROP`/`ALTER` against production. Restore last
   night's nightly backup (Runbook 2) and accept the loss of today's entries — that's the price of the
   missing snapshot, and the lesson is to always snapshot before a schema migration.
3. **Never** write a manual "down" migration against live data under pressure. Roll forward with a
   tested corrective migration once the stack is stable on known-good code.

---

## When in doubt

Stop changing things. The data is only as safe as the last good dump, and most outages here are
_availability_ (a container to restart), not _integrity_ (data to recover). Restart the cheap thing
(`api`, `redis`) before touching the irreplaceable thing (`postgres`).
