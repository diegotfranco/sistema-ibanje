# Improvements Backlog

Punch list from the 2026-05-10 architecture review. Ordered by impact ÷ effort.

**Status legend:** `[x]` shipped · `[~]` partially shipped (scope note) · `[ ]` open ·
~~strikethrough~~ moot. Most of Tiers 1–2 and the Tier-3 hardening items were worked through in the
2026-06-13/14 batches; remaining open items are flagged **Deferred** with a one-line rationale.

---

## Tier 1 — Must-fix before real production

### 1. Enforce CSRF on all mutating routes — ✅ done

- [x] `app.csrfProtection` runs as a global `preHandler` on every non-safe method ([apps/api/src/app.ts](../apps/api/src/app.ts)). Frontend auto-refetches the token on 403.

### 2. Sanitize rendered minutes (XSS) — ✅ done

- [x] Server-side allowlist sanitizer at [apps/api/src/modules/minutes/sanitize.ts](../apps/api/src/modules/minutes/sanitize.ts) (called on write). The web renderer is TipTap read-only — no `dangerouslySetInnerHTML`, so DOMPurify was unnecessary. CSP (#12) adds defense-in-depth.

### 3. Make email failures observable — ✅ done (2026-06-13)

- [x] `send()` in [apps/api/src/lib/email.ts](../apps/api/src/lib/email.ts) now throws on Resend error / SDK rejection (recipient kept out of the message). Admin-triggered invite surfaces a 502; self-serve reset stays silent but logs `req.log.error` (no enumeration).

---

## Tier 2 — Production maturity

### 4. Wrap monthly closing in a transaction — ✅ done (2026-06-13)

- [x] `closeMonthlyClosing` runs in `db.transaction`; the closing row is taken `SELECT … FOR UPDATE` and re-checked inside the tx, so a concurrent second close blocks then gets 409. One concurrency regression test asserts exactly-one-winner.

### 5. Rate-limit beyond auth endpoints — ✅ done (per-route), global default skipped by design

- [x] Generous per-route caps on `POST /users` (20/h), `PATCH /users/:id/password` (10/h), receipt upload (60/h) — sized to trip only on abuse.
- [ ] **Deferred (intentional):** a global per-user default. At single-church scale the per-route caps + the auth limiter cover the real abuse vectors; a blanket limiter risks false positives for little gain.

### 6. Frontend tests — ✅ done

- [x] Vitest + Testing Library, 100+ test files, 70% line gate in CI. Playwright e2e + WCAG axe audit also gated.

### 7. Observability: metrics + error tracking — ⏸ Deferred

- [ ] **Deferred:** ops-plane concern (Prometheus/Sentry). Valuable but not blocking for a single internal deployment; revisit if/when traffic or operator count grows.

### 8. Backup verification — ✅ done (2026-06-14)

- [x] [scripts/verify-backup.sh](../scripts/verify-backup.sh): pulls the latest dump, restores into a throwaway DB, fails on no-backup / restore-error / empty structural table. Documented in [DEPLOY.md](DEPLOY.md).

### 9. Cache permissions per request — ⏸ Deferred

- [ ] **Deferred:** premature optimization at this scale (each check is a single indexed query), and a request-scoped cache adds a staleness footgun for little benefit. Revisit only if profiling shows it matters.

### 10. Deploy/rollback runbook gaps — ✅ done (trimmed, 2026-06-14)

- [x] Migration-rollback policy (forward-only + snapshot-before-migrate + not-zero-downtime + PG-18 decision) added to [DEPLOY.md](DEPLOY.md).
- [x] New [docs/RUNBOOKS.md](RUNBOOKS.md) with the 3 a solo operator actually reaches for: can't-log-in / Redis down, restore from backup, migration gone wrong. OOM / disk-full intentionally skipped (cloud-host concerns, low value here).

---

## Tier 3 — Polish

### 11. File upload hygiene — ✅ done (2026-06-14)

- [x] Receipts are authed-streamed (not presigned — MinIO is internal-only), so the right place was the stream response: `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` + a real extension ([entries/controller.ts](../apps/api/src/modules/finance/expenses/entries/controller.ts)). Frontend button relabeled "Baixar comprovante".
- [x] Quota is the existing 5 MB cap + magic-byte-verified JPEG/PNG/PDF allowlist (`uploadExpenseReceipt`).

### 12. CSP header in Nginx — ✅ done (2026-06-14)

- [x] Tight CSP (`script-src 'self'`, no `unsafe-inline` for scripts) + `X-Content-Type-Options` + `X-Frame-Options: DENY` + `Referrer-Policy` in [nginx.conf](../apps/web/nginx.conf), re-emitted in the `add_header`-bearing locations. The inline theme bootstrap was externalized to `public/theme-init.js` to satisfy `script-src 'self'`.

### 13. Centralize status string literals — ✅ done for finance status code (scoped)

- [x] Swept `'aberto'/'fechado'/'paga'/'rejeitado'` in finance monthly-closings repo + service and the reports request/response schemas onto the shared `ClosingStatus`/`EntryStatus` enums.
- [ ] **Follow-up (low priority):** `finance/reports/repository.ts` still has ~40 inline `eq(status, 'paga')` predicates. Deliberately left out of this pass to bound the blast radius on financial query code; mechanical to finish later.

### 14. Audit log read endpoint — ✅ done (2026-06-14)

- [x] First filled the write-coverage gap: income/expense entry create/update/void now call `logAudit` (the money trail was previously unaudited).
- [x] New admin-only module exposing `GET /audit?entityType&entityId&userId&action&from&to` (paginated, capped), gated by `Users.View`. Frontend `/configuracoes/auditoria` page (filters + table + mobile cards + detail sheet), framed as the LGPD accountability surface. Tests in both apps.

### 15. Pagination caps in handlers — ✅ done

- [x] List schemas enforce `.max(100)` at the Zod boundary (verified at runtime).

### 16. Frontend code-splitting — ⏸ Deferred

- [ ] **Deferred:** premature at this user count; current bundle is fine. Revisit if first-load latency becomes a real complaint.

### 17. Optimistic updates on high-frequency forms — ⏸ Deferred

- [ ] **Deferred:** UX polish whose rollback bugs are risky on a financial-entry surface. Not worth the correctness risk yet.

### 18. Mobile responsiveness sweep — ✅ done (2026-06-14)

- [x] Fixed the stray non-responsive form/display grids (`grid-cols-2` → `grid-cols-1 sm:grid-cols-2`) in attenders, minutes, membership-letters. Left deliberate 2-up metric-tile grids (dashboard KPIs, closing metrics) alone.

### 19. ~~Dead dependencies~~ — moot

- ~~Remove `next-themes` and `cmdk`~~ — both are in use (`ui/sonner.tsx`, `ui/command.tsx`). No action.

### 20. Postgres 17 LTS instead of 18 — ✅ decided: stay on 18

- [x] Keeping `postgres:18-alpine`. Decision recorded in [DEPLOY.md → migrations & rollback policy](DEPLOY.md). A major-version change is a deliberate, separately-planned dump→upgrade→restore→verify op, not a routine pin change.

### 21. ~~`tsx watch` crash recovery in dev~~ — moot

- ~~Replace with `nodemon --exec tsx`~~ — the dev script already runs `node --watch --import tsx`, which restarts on crash. No action.

### 22. Request-scoped logger context — ✅ done (2026-06-13)

- [x] [requireAuth](../apps/api/src/hooks/requireAuth.ts) binds `req.log = req.log.child({ userId })` after session load, so every downstream log line is attributable.

---

## Added since the original review

### A. OWASP password + auth hardening — ✅ done (Batch A)

- [x] Policy floor 12 / max 64 chars, no composition rules; offline common-password reject behind an async `isCommonPassword` seam (HIBP-swappable). Soft email-keyed login lockout (Redis), timing-oracle fix (dummy argon2 verify on the not-found path), reset-token consume-on-use + constant-time compare, session cookie `Secure`/`HttpOnly`/`SameSite=Lax` + `trustProxy`. Frontend `PasswordStrengthBar` + shared `newPasswordField` (12-char min) across reset/change forms.

### B. Dependency scanning — ✅ done (2026-06-14)

- [x] [.github/dependabot.yml](../.github/dependabot.yml): weekly npm (root pnpm workspace) + github-actions updates, grouped to keep PR noise low; security advisories surface regardless of schedule.

### C. MFA / TOTP — 🔜 next security epic (not built)

- [ ] **Roadmap:** optional TOTP second factor for high-privilege roles (admin/treasurer). The biggest remaining account-compromise lever after the Batch-A hardening. Scope as its own epic: enrollment flow, recovery codes, per-role enforcement policy.

---

## Notes

- Each tier was roughly "shippable as one batch." Remaining open items are the deferrals above plus #13's follow-up sweep and the MFA epic.
- Threat model that drove the right-sizing: single-church, low-traffic, internal users behind a Cloudflare Tunnel — correctness/account-compromise outweigh scale/anonymous-abuse hardening.
