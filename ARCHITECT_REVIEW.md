# Architect Review — Sistema Ibanje

## Context

Sistema Ibanje is a church management system for a Brazilian congregation (~100 members), built as a teaching project for an apprentice software architect and a real client. The system is feature-complete: members, RBAC, full finance (entries, monthly closings, reports, PDFs, MinIO receipts), and assembleia (pautas + atas with versioned approval and rich text). Stack: Fastify 5 + Drizzle ORM + Postgres 18 + Redis 8 + MinIO on the backend; Vite 8 + React 19 + Tailwind v4 + TanStack Query + shadcn/ui on the frontend; pnpm + Turbo monorepo.

This document is a candid assessment of how the project measures against industry standard, calibrated to the scale (small parish, real-but-low-stakes financial data, single-developer team).

## TL;DR

| Dimension             | Score    | Verdict                                                                         |
| --------------------- | -------- | ------------------------------------------------------------------------------- |
| Architectural design  | **9/10** | Textbook layering, clean module structure, modern stack choices                 |
| Code quality          | **8/10** | Consistent patterns, strong typing, minimal dead code                           |
| Security fundamentals | **7/10** | Solid auth primitives; gaps in token rate-limit, MIME sniffing, audit log       |
| Database engineering  | **5/10** | Good schema/constraints; **no indexes**, missing transactions, N+1 risk         |
| Frontend resilience   | **7/10** | Excellent state mgmt; missing 401 handler, error boundary, server-error mapping |
| Testing               | **0/10** | Zero tests anywhere — biggest single gap                                        |
| Operational readiness | **3/10** | No CI, no Dockerfile, no backups, no email, seed unsafe in prod                 |
| Documentation         | **9/10** | `claude.md` and README are above the bar for solo projects                      |

**Overall:** the architecture is genuinely good. The codebase is what a small team would ship after a few iterations of taste. The remaining gaps are operational and resilience concerns, not design flaws — and they are the _exact_ gaps every greenfield project carries when it crosses from "feature-complete" to "production-ready."

---

## What's Industry-Standard (Strengths)

### 1. Module structure and layering — clean across the board

The `routes → controller → service → repository + schema` layering is enforced consistently across every module verified ([apps/api/src/modules/members/](apps/api/src/modules/members/), [minutes](apps/api/src/modules/minutes/), [board-meetings](apps/api/src/modules/board-meetings/), [finance](apps/api/src/modules/finance/)). Controllers stay thin; services own business logic and permission checks; repositories are pure data access. This is the canonical "hexagonal-lite" structure used by most Node.js shops in production.

The single-aggregator pattern in [apps/api/src/modules/index.ts](apps/api/src/modules/index.ts) (`registerRoutes(app)`) is also textbook — adding a module touches one file, not the bootstrap.

### 2. Type system and validation — modern and rigorous

- **Zod v4 everywhere** — request schemas, form schemas, env validation. The `IdParamSchema`/`IdParam` pattern in [apps/api/src/lib/validation.ts](apps/api/src/lib/validation.ts) and the `Module`/`Action` const-object pattern in [apps/api/src/lib/constants.ts](apps/api/src/lib/constants.ts) eliminate magic strings at compile time.
- **fastify-type-provider-zod** bridges Zod into Fastify's runtime validation _and_ the OpenAPI generator. This is how mature TS APIs are built in 2026 — see ts-rest, tRPC, Hono with Zod.
- **`$inferInsert`/`$inferSelect`** for Drizzle insert/update parameter types instead of hand-written DTOs. Industry-standard since Drizzle ~0.30.

### 3. Auth and session model — correct primitives

- **Session cookies + Redis** is the right choice over JWTs for this kind of app (revocable, doesn't leak claims, works with CSRF). JWT-everywhere is a well-known anti-pattern.
- **Argon2id + pepper** ([env.ts](apps/api/src/config/env.ts)) is OWASP-current. Argon2 won the Password Hashing Competition; pepper (server secret added before hash) defends against hash-DB exfiltration.
- **CSRF** via `@fastify/csrf-protection`, with the frontend pattern of cached token + auto-refetch on 403 ([apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)) is genuinely production-grade. Most teams under-implement CSRF.
- **Per-route rate limits** on login (5/15min), register (3/hr), password reset (3/hr).

### 4. RBAC model — well-thought-out

The dual `role_module_permissions` (template, copy-on-create) + `user_module_permissions` (runtime truth) split is _exactly_ how modern admin panels handle "role changes shouldn't retroactively rewrite users." Same model used in Auth0 (organizations + per-user grants) and AWS IAM (group policies + attached user policies). Many codebases get this wrong with a single join table; this one got it right.

### 5. Frontend state architecture — gold standard

Zero Redux/Zustand. **Server state in TanStack Query, form state in RHF, URL in router, ephemeral UI in `useState`/Context.** This is the consensus 2025–2026 React architecture. The custom [resourceQuery.ts](apps/web/src/lib/resourceQuery.ts) abstraction (`useResourceList`/`useResourceMutations`) is _earned_ — used by 7+ pages — not premature.

The single-source-of-truth route metadata driving both the router tree _and_ the recursive `filterRoutesByPermission()` sidebar ([apps/web/src/components/Sidebar.tsx](apps/web/src/components/Sidebar.tsx)) is a pattern most teams reinvent badly.

### 6. Schema design — strong constraints, good modelling

The 2-level chart of accounts (parent group → leaf, entries reject parents at the API layer), the `targetDate` on designated funds with referential validation, and the `aberto → em revisão → aprovado → fechado` state machine on monthly closings reflect actual accounting domain knowledge. Database CHECK constraints in [schema.ts](apps/api/src/db/schema.ts) (amounts > 0, status enums) defend invariants at the deepest layer.

### 7. Documentation — above the solo-project bar

[claude.md](claude.md) at the repo root is the single best onboarding artifact in this project. It documents _why_ — pepper choice, NodeNext + CJS rationale, RBAC philosophy, self-service rules. This kind of documentation is what separates "code that survives the founding engineer's departure" from "tribal knowledge."

---

## Gaps vs Industry Standard

Ordered by impact, not by effort.

### Tier 1 — must address before going live with real money

#### G1. Zero database indexes beyond primary keys

The migration ([0000_long_xorn.sql](apps/api/src/db/migrations/0000_long_xorn.sql)) creates 20 tables with **no secondary indexes**. Every permission check (the hottest read path in the app) full-scans `user_module_permissions`. Foreign keys are not auto-indexed in Postgres. At 100 members this is invisible; at 5,000 it stalls.

Add at minimum:

- `user_module_permissions(user_id)` — every authorised request
- `users(role_id)`, `members(user_id)`
- `income_entries(category_id, reference_date)`, `expense_entries(category_id, reference_date)`, `(designated_fund_id)`
- `monthly_closings(period_year, period_month)` — UNIQUE already covers this; verify
- `minute_versions(minute_id, version)` — likely covered by UNIQUE

Industry rule of thumb: **every FK gets an index unless you have proven you never query by it.**

#### G2. Multi-step writes are not transactional

Several services do read-modify-write or two-table inserts without `db.transaction(...)`:

- Minute create → minute version insert
- User create → copy role permissions
- Monthly closing state transitions
- `assertPeriodEditable` reads then entry write — race window with concurrent closing submission

For a finance system, the absence of transactions is the kind of bug that doesn't show up in dev and corrupts production data once a year. **Wrap any operation that writes more than one row across more than one table in `db.transaction()`.**

#### G3. No audit log for finance operations

Income/expense create/edit/cancel, monthly closing approve/reject/close, role-permission changes — none are recorded. For a church handling tithes and offerings, this is a governance miss; even minimal compliance (LGPD; church board accountability) wants "who did what when." A single `audit_log(user_id, action, entity, entity_id, before, after, at)` table with a service helper would close 80% of this gap.

#### G4. No backup strategy documented

Postgres data and MinIO receipts are the two irreplaceable assets. There is no mention of `pg_dump` cron, no MinIO mirror, no documented restore procedure. **For a real client, this is the gap that turns a hardware failure into a career-ending phone call.** Daily `pg_dump` to a second location + monthly tested restore is the minimum viable answer.

#### G5. Email not implemented

[auth/service.ts](apps/api/src/modules/auth/service.ts) and the user invite flow log `TODO: send email`. Password reset is functionally broken — token is generated and stored, but never delivered. Either wire Resend / AWS SES / Postmark (free tiers cover this scale easily), or remove the endpoint until you do. Leaving it in is worse than removing it.

#### G6. Seed truncates unconditionally

[apps/api/src/db/seed.ts](apps/api/src/db/seed.ts) issues `TRUNCATE ... RESTART IDENTITY CASCADE` with no env guard. One stray `pnpm db:seed` against the wrong `DATABASE_URL` and the church loses everything. Add the three-line guard:

```ts
if (env.NODE_ENV === 'production') throw new Error('seed disabled in production');
```

### Tier 2 — required before scale or first incident

#### G7. Zero tests

No `*.test.ts`, no Vitest config, no Playwright. For a financial system this is _the_ highest-leverage gap. You don't need 80% coverage; you need:

- Permission checking (`hasPermission`, `assertPermission`) — pure function, easy
- Monthly closing state machine + opening balance computation
- Period-editable rule
- One end-to-end smoke test of the critical path (login → create entry → close month)

10–15 well-chosen tests would catch the regressions that _will_ eventually happen as you keep editing.

#### G8. No CI

No `.github/workflows/`. Every push could break typecheck, lint, or build silently. A 3-minute GitHub Action running `pnpm lint && pnpm -r typecheck && pnpm build` on PR is the single highest-leverage operational addition.

#### G9. No Dockerfile / production deploy story

`docker-compose.dev.yml` is excellent for local; there is no production equivalent. No multi-stage Dockerfile for the API, no static-build pipeline for the web app, no `.env.production.example`, no deployment target documented. This needs to exist before launch — even a one-page runbook.

#### G10. Frontend resilience holes

- **No 401 handler** in [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts). When sessions expire, queries silently fail; users see a toast and stale UI. Add a global query error meta handler that redirects to `/login` on 401.
- **No error boundary** anywhere. A render error white-screens the whole app. One root boundary around `AppLayout` is a 30-line fix.
- **Server validation errors are not mapped to fields**. Backend returns `{ message }`; frontend toasts it. Industry standard is `{ message, fieldErrors: { email: '...' } }` mapped to `form.setError(field, ...)`.

### Tier 3 — quality polish, do when convenient

- **No response schemas in OpenAPI** — request side is fully typed; responses say "200 OK" with no shape. Adds ~5 lines per route; gives the frontend auto-generated types and the Scalar UI a real contract.
- **N+1 in `listMinutes`** — `Promise.all(rows.map(findLatestVersion))` should be a single LATERAL or window-function query. Fine at current scale.
- **No MIME sniffing on uploads** — `lib/storage.ts` trusts `Content-Type`. The `file-type` library reads magic bytes; one extra check.
- **No request correlation IDs** — `req.id` is built into Pino+Fastify, just enable it. Makes debugging across log lines trivial.
- **No `.nvmrc` / `engines`** — pin Node 22; takes 30 seconds; saves a future onboarding incident.
- **No pre-commit hook** — husky + lint-staged is overkill for a solo project, but conventional once you have a collaborator.
- **TODOs left in production code** — replace with `throw new Error('not implemented')` so they fail loudly, or remove the endpoints.
- **Two unsafe casts in UserForm** — `undefined as unknown as number` for unset `roleId`. Use a proper Zod fallback or `z.number().optional()` aligned with form defaults.
- **Magic status strings** — `'ativo' | 'pendente' | 'paga' | 'aprovada'` repeated in many service files. Extract const objects (the same pattern already used for `Module`/`Action`).

---

## How This Compares to the Industry

For context calibration:

- **Better than 90% of solo MVPs** on architectural cleanliness, type safety, RBAC modeling, and documentation.
- **Comparable to early-stage startup codebases** (~Series A engineering team) on module structure, validation discipline, and frontend state architecture.
- **Below typical startup standards** on testing, CI, observability, and deploy automation. Most companies of any size have these even when their architecture is messier.
- **Below enterprise standards** on audit logging, transactions, indexing rigor, and backup automation. Enterprise codebases are _worse_ in many ways but rarely miss these specific items because compliance forces the issue.

Translation: the **design** here is at a senior level. The **operational maturity** is at a mid-level — and that's not unusual for a feature-complete-but-not-launched project. The good news is that operational maturity is mechanical to add; design quality is the hard part, and it is already done.

---

## Prioritized Gap List

### Tier 1 — must fix before going live

1. **G5** — wire email delivery (Resend / SES / Postmark)
2. **G1** — add the 6–8 missing database indexes
3. **G2** — wrap multi-step writes in `db.transaction()`
4. **G3** — add `audit_log` table + service helper, wire into finance + permission changes
5. **G4** — document and automate Postgres + MinIO backups; test restore once
6. **G6** — guard `db:seed` against production

### Tier 2 — must fix before scale or first incident

7. **G7** — add Vitest + first 10 tests
8. **G8** — add CI (GitHub Actions: lint + typecheck + build)
9. **G9** — production Dockerfile + deploy runbook + `.env.production.example`
10. **G10a** — global 401 handler in API client
11. **G10b** — root error boundary around `AppLayout`
12. **G10c** — map server `fieldErrors` → `form.setError` in mutation hooks

### Tier 3 — polish, when convenient

13. Response schemas in OpenAPI route definitions
14. Replace `listMinutes` N+1 with single query
15. MIME magic-byte sniffing on receipt uploads
16. Request correlation IDs in Pino logs
17. Pin Node version (`.nvmrc` + `engines`)
18. Replace `TODO` comments with `throw new Error('not implemented')`
19. Fix unsafe casts in `UserForm`
20. Extract status magic strings into const objects

---

## Closing Note

This is a project that a senior engineer would be proud to have shipped, with the operational gaps that every senior engineer's project has on day one. The architecture choices show internalized understanding of _why_ patterns exist, not just _what_ they are. The remaining work is execution-level — important, but mechanical.
