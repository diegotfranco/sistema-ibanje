# Sistema Ibanje — Claude conventions

## Working style
- Always brainstorm and agree on design before writing any code.
- Delegate all coding to a subagent using the Haiku model.
- This is a real project and a learning project — explain decisions, not just results.

## Tech stack
- **Runtime**: Node.js, TypeScript (CJS, `"module": "NodeNext"`, no `import.meta`)
- **Framework**: Fastify 5
- **ORM**: Drizzle ORM with postgres.js driver — always use shaped `.select({...})`, never leak `passwordHash`
- **Validation**: Zod v4 — use `z.email()` not `z.string().email()`; `.default()` makes a field optional, never chain `.optional()` after it
- **Auth**: session-based via `@fastify/session` + Redis (`connect-redis` v9 named export)
- **Monorepo**: pnpm workspaces + Turborepo; `eslint` and `prettier` live at the root

## Architecture
Every module follows: `routes.ts → controller.ts → service.ts → repository.ts + schema.ts`

## Shared utilities
- `src/lib/errors.ts` — `httpError(status, message)` and `isHttpError(err)`. Import here, never redefine locally.
- `src/lib/permissions.ts` — `hasPermission(userId, moduleName, permissionName)`. Single DB query, used by both the `checkPermission` hook and service-layer `assertPermission`.
- `src/hooks/requireAuth.ts` — preHandler that enforces a valid session.
- `src/hooks/checkPermission.ts` — preHandler factory for route-level RBAC.

## RBAC model
- `role_module_permissions` = read-only template, only used at user creation time to populate `user_module_permissions`. Never queried at runtime.
- `user_module_permissions` = runtime source of truth, always queried directly, no fallback.
- Permission names (Portuguese): `Acessar`, `Cadastrar`, `Editar`, `Remover`, `Relatórios`
- Module name for users: `Usuários`

## Self-service rules (users module)
- `PATCH /users/:id`: self can change name/email only — not `roleId`.
- `PATCH /users/:id/password`: self must supply `currentPassword`; admin with `Editar` does not.
- `DELETE /users/:id`: cannot deactivate own account (400).
- `PUT /users/:id/permissions`: cannot modify own permissions (403).

## User creation flows
- **Admin creates**: `POST /users` — status `ativo`, permissions copied from role, optional `memberId` links member atomically in one transaction.
- **Self-registration**: `POST /auth/register` — status `pendente`, role `Membro`, no permissions copied yet.
- **Approval**: `PATCH /users/:id/approve` — status → `ativo`, copies role permissions, generates invite token.
- **Invite token**: raw token logged as `TODO: send invite email`; stored sha256-hashed in `password_reset_tokens` with 24h expiry.

## Users vs Members
Users = system login accounts. Members = congregation persons. Not all members are users; not all users are members. Linked optionally via `members.userId`. Admin creates a user from a member by passing `memberId` to `POST /users`.

## CSRF flow (frontend must follow)
1. `GET /auth/csrf-token` → save token.
2. Send `x-csrf-token: <token>` on every state-changing request.
3. After login, call `GET /auth/csrf-token` again — session is regenerated on login, invalidating the old token.

## Known gaps / deferred decisions
- `members.addressNumber` is `INTEGER` — may need `VARCHAR` for addresses like "123A".
- Email sending not implemented — invite and password-reset tokens are logged as TODO stubs.
- `@fastify/cors` is installed but not registered — needed before any frontend work.
- `packages/shared/src/schemas/member.schema.ts` uses snake_case field names — inconsistent with the rest of the codebase, needs fixing when the members module is built.
