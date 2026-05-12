# Improvements Backlog

Punch list from the 2026-05-10 architecture review. Ordered by impact ÷ effort. Check items off as we land them.

---

## Tier 1 — Must-fix before real production

### 1. Enforce CSRF on all mutating routes

- [ ] Apply `app.csrfProtection` (or equivalent global hook on POST/PUT/PATCH/DELETE) to every mutating route, not just auth.
- **Why:** the frontend already sends `x-csrf-token` on every mutation, but the backend only validates it on auth routes. `SameSite=Lax` is partial protection, not a substitute. Today an authenticated admin clicking a malicious link could fire `POST /expense-entries` or `DELETE /users/:id`.
- **Where:** [apps/api/src/plugins/csrf.ts](../apps/api/src/plugins/csrf.ts), all module `routes.ts` files.
- **Effort:** ~half a day. Decide: per-route opt-in (explicit) vs global `onRequest` for unsafe methods (broader, fewer mistakes).

### 2. Sanitize rendered minutes (XSS)

- [ ] Wrap [apps/web/src/components/ui/rich-text-editor.tsx:110](../apps/web/src/components/ui/rich-text-editor.tsx#L110) `dangerouslySetInnerHTML` with `DOMPurify.sanitize(html)`.
- [ ] Optionally also sanitize server-side on minutes write so persisted content is always safe.
- **Why:** minutes are stored as raw HTML. TipTap sanitizes inputs through its editor pipeline, but anything inserted via the API (or paste edge-cases) renders as-is. A user with write permission on minutes can own any reader, including admins.
- **Effort:** ~1 hour.

### 3. Make email failures observable

- [ ] In [apps/api/src/lib/email.ts](../apps/api/src/lib/email.ts), throw on Resend error for admin-triggered flows (invite, manual reset). Keep self-serve password-reset silent (don't leak account existence) but emit a metric/log line on failure.
- **Why:** today a token is created in the DB and the email may silently fail. The user gets no email, the admin gets no signal, the token rots.
- **Effort:** ~1 hour.

---

## Tier 2 — Production maturity

### 4. Wrap monthly closing in a transaction

- [ ] Wrap [apps/api/src/modules/finance/monthly-closings/service.ts:195-241](../apps/api/src/modules/finance/monthly-closings/service.ts#L195-L241) in `db.transaction(async tx => …)`. Pass `tx` to repo calls.
- **Why:** balance compute → write is read-modify-write across multiple tables. Concurrent submits race. Financial state must be transactionally consistent.
- **Effort:** ~half a day, including a regression test for concurrent submissions.

### 5. Rate-limit beyond auth endpoints

- [ ] Add a sensible global default (e.g. 200 req/min/user) in [apps/api/src/plugins/rateLimit.ts](../apps/api/src/plugins/rateLimit.ts).
- [ ] Tighter per-route caps on `POST /users`, receipt upload, password change.
- **Why:** today a runaway client retry, a buggy frontend loop, or a compromised account can hammer the API freely.
- **Effort:** ~2 hours.

### 6. Frontend tests

- [ ] Set up Vitest + Testing Library in `apps/web`.
- [ ] First 10 tests covering: login form, RHF + Zod field-error mapping, `useResourceMutations` happy/error paths, CSRF retry in `api.ts`, ProtectedRoute redirect.
- [ ] One Playwright smoke test: login → create income entry → close month.
- **Why:** zero web tests today. UI regressions land in production without warning.
- **Effort:** ~1 day for the harness + first batch.

### 7. Observability: metrics + error tracking

- [ ] Add `fastify-metrics` for Prometheus-format `/metrics` endpoint (p50/p95/p99 per route, request counts, error rates).
- [ ] Wire Sentry (or self-hosted Glitchtip) on both API and web. Strip PII in `beforeSend`.
- [ ] Optional: minimal Grafana board (requests/sec, error rate, p95 latency).
- **Why:** today the only signal of a slow query, leak, or 5xx spike is "users complaining."
- **Effort:** ~1 day.

### 8. Backup verification

- [ ] Add a script that monthly: pulls the latest backup, restores into a throwaway DB, runs `SELECT count(*)` on critical tables, alerts on failure.
- **Why:** [scripts/backup.sh](../scripts/backup.sh) creates files but never proves they restore. An untested backup is a hope.
- **Effort:** ~half a day.

### 9. Cache permissions per request

- [ ] Load `user_module_permissions` once at the start of the request, attach to `req.user.permissions` (or session). `checkPermission` reads from memory.
- **Why:** today every permission check is a DB roundtrip; multi-check routes amplify it. Standard request-scoped cache pattern.
- **Where:** [apps/api/src/lib/permissions.ts](../apps/api/src/lib/permissions.ts), [apps/api/src/hooks/checkPermission.ts](../apps/api/src/hooks/checkPermission.ts).
- **Effort:** ~half a day.

### 10. Deploy/rollback runbook gaps

- [ ] Document migration rollback policy: forward-only, snapshot DB before migrate, restore-from-snapshot to undo.
- [ ] Add 4-5 incident runbooks: Postgres OOM, MinIO disk full, stuck monthly closing, can't log in (Redis down), email not sending.
- [ ] Note that `docker compose run migrate` is not zero-downtime (acceptable at this scale, just be explicit).
- **Where:** [docs/DEPLOY.md](DEPLOY.md), new `docs/RUNBOOKS.md`.
- **Effort:** ~half a day.

---

## Tier 3 — Polish

### 11. File upload hygiene

- [ ] Add `Content-Disposition: attachment` (or response-content-disposition param) on presigned receipt URLs to prevent inline render of polyglots.
- [ ] Document/enforce a per-user upload quota.
- **Where:** [apps/api/src/modules/finance/expenses/entries/](../apps/api/src/modules/finance/expenses/entries/), MinIO presign code.

### 12. CSP header in Nginx

- [ ] Add a tight `Content-Security-Policy` to [apps/web/nginx.conf](../apps/web/nginx.conf). Defense-in-depth for the minutes XSS.

### 13. Centralize status string literals

- [ ] Sweep `'aberto' | 'fechado' | 'ativo' | 'inativo' | 'paga' | 'pendente' | 'cancelada'` etc. into enums in `packages/shared`. Replace inline strings.

### 14. Audit log read endpoint

- [ ] `GET /audit?entityType=&entityId=&from=&to=` (admin-only) so compliance queries don't require psql.

### 15. Pagination caps in handlers

- [ ] Sweep list endpoints: confirm Zod `max(100)` is honored at runtime; clamp where it isn't.

### 16. Frontend code-splitting

- [ ] `React.lazy` on heavy modules (reports, minutes editor). Suspense fallback at the route level.

### 17. Optimistic updates on high-frequency forms

- [ ] Income/expense entry create: optimistic insert into the list; rollback on error.

### 18. Mobile responsiveness sweep

- [ ] `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` across forms. Verify with the client whether mobile is in scope.

### 19. Dead dependencies

- [ ] Remove `next-themes` and `cmdk` from [apps/web/package.json](../apps/web/package.json) if confirmed unused.

### 20. Postgres 17 LTS instead of 18

- [ ] Decide before the church goes live. Pin to 17 in [docker-compose.prod.yml](../docker-compose.prod.yml).

### 21. `tsx watch` crash recovery in dev

- [ ] Replace with `nodemon --exec tsx` (or similar) so the API auto-restarts after a crash.

### 22. Request-scoped logger context

- [ ] Use Pino's `req.log.child({ userId })` so every log line carries user ID without manual plumbing.

---

## Notes

- Each tier is roughly "shippable as one batch." We can do them one at a time as agreed.
- Effort estimates assume one focused session, no surprises.
- Order within a tier is flexible — pick what fits the day.
