# Sistema Ibanje — Claude conventions

## Working style

- Always brainstorm and agree on design before writing any code.
- Act as a senior software architect. For every design and implementation decision, explain:
  - **Why** this pattern or approach was chosen for this specific situation.
  - **Where** it is commonly used in the industry (what kinds of systems, teams, or scales it appears in).
  - **When** to prefer it over the alternatives — and what the alternatives are.
- The goal is not just to ship features — it is to build Diego's mental model as a future architect.

---

## Tech stack

**Backend (`apps/api`)**

- Runtime: Node.js 22, TypeScript — `"module": "NodeNext"` with ESM (`"type": "module"`). Use `import.meta.url` and `fileURLToPath` instead of `__dirname`.
- Framework: Fastify 5 + `fastify-type-provider-zod` (Zod ↔ Fastify validation + OpenAPI)
- ORM: Drizzle ORM with postgres.js driver — always use shaped `.select({...})`, never leak `passwordHash`
- Validation: Zod v4 — `z.email()` not `z.string().email()`; `z.iso.date()` not `z.string().date()`; `.default()` makes a field optional, never chain `.optional()` after `.default()`
- Auth: session-based via `@fastify/session` + Redis (`connect-redis` v9 named export)
- Email: Resend SDK — see Email section below
- Storage: MinIO (S3-compatible) via `@aws-sdk/client-s3`
- PDF: `@react-pdf/renderer` server-side (JSX → `renderToBuffer()`); `tsconfig.json` has `"jsx": "react-jsx"`
- OpenAPI: `@fastify/swagger` + `@scalar/fastify-api-reference` at `GET /docs`

**Frontend (`apps/web`)**

- Vite 8, React 19, TypeScript (`"moduleResolution": "bundler"`, ESM)
- Tailwind CSS v4 — `@import "tailwindcss"` in CSS, no config file
- React Router v7 — `react-router` package (not `react-router-dom`)
- TanStack Query v5 — 401/403 retry suppressed; `staleTime: Infinity` for currentUser
- shadcn/ui — style `radix-mira`, base color `neutral`, icon library `lucide`
- React Compiler via `babel-plugin-react-compiler` + `@rolldown/plugin-babel`

**Monorepo**

- pnpm workspaces + Turborepo; `eslint` and `prettier` live at the root, hoisted via `.npmrc public-hoist-pattern`
- `packages/shared` — only add when two real consumers exist; don't anticipate needs

---

## Backend architecture

Every module follows: `routes.ts → controller.ts → service.ts → repository.ts + schema.ts`

All module routes go through `src/modules/index.ts` → `registerRoutes(app)`. Adding a module means touching only that file, not `app.ts`.

**Controller HTTP conventions:**

- `list` → 200, `getById` → 200/404, `create` → 201, `update` → 200/404
- `remove` → 204/404, state-transition actions (submit/approve/close) → 200 with full resource
- `setPermissions` → 204, `getPermissions` → 200

**DTO naming:** include direction — `CreateMemberRequestSchema`/`CreateMemberRequest`, `MemberResponse` — not just `CreateMemberSchema`.

**Repository conventions:**

- No named row types (`UserRow`, `MemberRow`) — dead exports; service infers types from return types
- Use `$inferInsert` for write-side params: `Omit<typeof table.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>`
- `$inferSelect` is wrong for joins — leave short inline types as-is

---

## Shared backend utilities

- `src/lib/errors.ts` — `httpError(status, message, { fieldErrors? })` and `isHttpError(err)`. Never redefine locally.
- `src/lib/permissions.ts` — `hasPermission(userId, moduleName, permissionName)`. Single DB query.
- `src/lib/finance.ts` — `assertPeriodEditable(referenceDate)`. Blocks writes when the period's closing is not `aberto`.
- `src/lib/redis.ts` — lazy singleton `getRedis()` / `closeRedis()`. Import here; never open a second connection.
- `src/lib/audit.ts` — fire-and-forget `logAudit(userId, action, entityType, entityId, opts?)`.
- `src/hooks/requireAuth.ts` — preHandler that enforces a valid session.
- `src/hooks/checkPermission.ts` — preHandler factory for route-level RBAC.

---

## RBAC model

- `role_module_permissions` = read-only template, only used at user creation time to populate `user_module_permissions`. Never queried at runtime.
- `user_module_permissions` = runtime source of truth, always queried directly, no fallback.
- Changing role permissions does NOT retroactively update existing users.
- Permission names (Portuguese): `Acessar`, `Cadastrar`, `Editar`, `Remover`, `Relatórios`, `Revisar`
- Module constants: use `Module.*` and `Action.*` from `src/lib/constants.ts` — never raw strings.

---

## Auth, sessions, and CSRF

**CSRF flow:**

1. `GET /auth/csrf-token` → saves token in session + returns it.
2. Every state-changing request sends `x-csrf-token: <token>`.
3. After login, session is regenerated — old token is invalid. Frontend re-fetches automatically on 403 (CSRF retry in `api.ts`).

**Remember-me:**

- Login controller reads `rememberMe` from body.
- Checked → `req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000`
- Unchecked → `req.session.cookie.expires = null; req.session.cookie.originalMaxAge = null`
- **Do NOT** set `maxAge = undefined` — the setter calls `new Date(Date.now() + undefined)` and produces Invalid Date, crashing the response.

**User creation flows:**

- **Admin creates**: `POST /users` — status `ativo`, permissions copied from role, optional `memberId` links member atomically.
- **Self-registration**: `POST /auth/register` — status `pendente`, role `Membro`, no permissions yet.
- **Approval**: `PATCH /users/:id/approve` — status → `ativo`, copies role permissions, sends invite email.
- **Invite token**: sha256-hashed in `password_reset_tokens` with 24h expiry; email sent via Resend after tx commits.

**Self-service rules:**

- `PATCH /users/:id`: self can change name/email only — not `roleId`.
- `PATCH /users/:id/password`: self must supply `currentPassword`; admin with `Editar` does not.
- `DELETE /users/:id`: cannot deactivate own account (400).
- `PUT /users/:id/permissions`: cannot modify own permissions (403).

**Users vs Members:** Users = login accounts. Members = congregation persons. Linked optionally via `members.userId`.

---

## Idempotency plugin (`src/plugins/idempotency.ts`)

Registered after session + CSRF so `req.session.userId` is populated.

- `preHandler`: reads `idempotency-key` header. Cache key = `idem:{userId}:{routerPath}:{key}`.
  - Cache hit → replay response with `Idempotent-Replay: true` header.
  - Cache miss → acquire NX lock (30s TTL). If lock held → 409 "Request already in progress".
- `onSend`: 2xx → write `{ status, body, contentType }` to Redis (24h TTL). Non-2xx → delete lock.
- No-op when header is absent — backward-compatible with callers that don't send it.

---

## Error handling contract

**Wire format:** `{ message: string, fieldErrors?: Record<string, string> }`. Field keys use dotted paths.

**Backend:**

- `httpError(status, message, { fieldErrors })` — third arg optional.
- `isUniqueViolation(err, constraintName?)` — matches Postgres code `23505`. Use inside try/catch around insert/update; rethrow as `httpError(409, msg, { fieldErrors })`.
- ZodError auto-maps `issue.path.join('.')` → `issue.message` via `plugins/errorHandler.ts`.

**Frontend:**

- `applyFieldErrors(err, form)` in `src/lib/forms.ts` — returns true if errors were placed under fields; caller falls back to toast if false.
- **formRef pattern**: when `useForm` lives in a child component but mutation in the parent, the form populates `formRef.current` so the parent's `onError` can call `applyFieldErrors`.

---

## Email (Resend SDK)

`resend.emails.send()` does **NOT** throw — it returns `{ data, error }`. Always funnel through the `send()` helper in `src/lib/email.ts` which checks both `result.error` and the try/catch.

Email sends must happen **after** the transaction commits. Capture tokens via callback inside the service, send after the service call returns.

---

## Frontend conventions

**Module layout:** `src/modules/<domain>/` mirrors backend. Flat per domain; subfolders only for clear submodules (e.g. `finance/income-entries/`).

**Schemas:** Zod form schemas live in `src/modules/<domain>/schema.ts` — colocated with the module. `packages/shared` is for response types only.

**Hooks:** form and mutation logic colocated as `use<Feature>.ts` hooks inside each module folder.

**Route metadata:** single source of truth (`AppRoute` type) drives both React Router tree and sidebar menu.

**API client (`src/lib/api.ts`):**

- `fetchWithRetry` — retries up to 2x on `res.status >= 500` or network `TypeError`; 250ms/750ms backoff with ±50% jitter.
- All mutations send `Idempotency-Key: crypto.randomUUID()` (reused across retries).
- `ApiError` has `retryAfterSeconds?: number` — parsed from `Retry-After` header.
- `rateLimitMessage(err)` — formats seconds → Portuguese (`X segundos / X minutos / X horas`). Use for all 429 toasts.
- `setAuthErrorHandler` — wired in `App.tsx` via `<AuthErrorListener>`; clears query cache and redirects to `/login` on any 401 (skipped for `/auth/login`).

**Resource abstractions:**

- `src/lib/resourceQuery.ts` — `useResourceList` + `useResourceMutations`: prepends `basePath` to queryKey internally. `describeError` calls `rateLimitMessage` on 429.
- `src/components/ResourceListPage.tsx` — generic CRUD list page used by all reference data pages.

**Lint patterns (no `eslint-disable` comments):**

- Generic `forwardRef`: extract render fn as named generic + `as unknown as TypeAlias` cast.
- `no-explicit-any` on library types: `as unknown as SpecificType` double-cast.
- `set-state-in-effect`: use "setState during render with a guard" instead of `useEffect`.
- `exhaustive-deps` for query hooks: prepend `basePath` to queryKey inside the hook.

**Misc tooling gotchas:**

- `shadcn CLI` reads root `tsconfig.json` for path aliases — path `@/*` must be in both `tsconfig.json` and `tsconfig.app.json`.
- `apps/api/tsconfig.eslint.json` must include every top-level dir (e.g. `test/`) or type-aware lint fails.
- Turborepo strips undeclared env vars — new vars must be added to `turbo.json` `globalEnv` or task `env` array.
- `**/*.tsbuildinfo` must be in `.dockerignore` — stale build-info makes `tsc` skip emit silently.
- Committed `.env.*.example` files must leave credentials BLANK — no church name, real domain, or real-looking defaults.

---

## Known gaps / deferred

- `members.addressNumber` is `INTEGER` — may need `VARCHAR` for addresses like "123A".
- TLS not handled by the Docker stack — runbook recommends Caddy / Cloudflare Tunnel / Traefik in front.
