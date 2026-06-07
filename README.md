# Sistema Ibanje

Church management system — members, finances, meeting minutes, and reports.

## Structure

```
apps/
  api/     Fastify 5 REST API (Node.js + TypeScript)
  web/     React 19 SPA (Vite + TypeScript)
packages/
  shared/  Shared types (currently empty — added on demand)
```

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [pnpm](https://pnpm.io) v10+
- [Docker](https://www.docker.com) (for Postgres, Redis, and MinIO)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# 3. Run migrations and seed
pnpm --filter @sistema-ibanje/api db:migrate
pnpm --filter @sistema-ibanje/api db:seed

# 4. Start both apps in dev mode
pnpm dev
```

API runs at `http://localhost:3000` · Web runs at `http://localhost:5173`

Interactive API docs: `http://localhost:3000/docs`

> The dev seed (`db:seed`) creates demo users (`admin@email.com / admin123`), ~100
> fictitious congregants, and years of sample finance data — convenient for local
> work, **never for production**. For a real deploy use `db:seed:prod` (see below).

## First-run configuration (clean slate)

These are the steps to take an empty database to a usable system. The same flow is
exercised by the automated bootstrap suite (`apps/api/test/bootstrap.prod.test.ts`).

### 1. Migrate + seed structural data and the first admin

In **production**, the seed is structural-only and creates a single Administrador
from environment variables — it does **not** insert demo users or sample data:

```bash
# In .env.production, set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars), e.g.:
#   ADMIN_EMAIL=tesouraria@suaigreja.com.br
#   ADMIN_PASSWORD=<a strong password>
#   ADMIN_NAME=Administrador            # optional, defaults to "Administrador"

pnpm --filter @sistema-ibanje/api db:migrate
pnpm --filter @sistema-ibanje/api db:seed:prod
```

`db:seed:prod` is **one-shot**: it refuses to run if the target tables already
contain data. It seeds roles, permissions, modules, payment methods, income/expense
categories, base designated funds (campanhas), the church-settings singleton, minute
templates, and finance settings (opening balance `0.00`). See
[`docs/DEPLOY.md`](docs/DEPLOY.md) for the full Docker deploy runbook.

If you omit `ADMIN_EMAIL`/`ADMIN_PASSWORD`, structural data is still seeded but no
user is created — you must then create the first admin yourself.

### 2. Log in and harden the admin account

1. Sign in at `/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set.
2. Change the password immediately (account menu → change password).

### 3. Configure the church identity

Go to **Configurações da Igreja** (`/church-settings`) and fill in the institutional
data — legal name, CNPJ, address, contact, and the current president/secretary names.
This data feeds the PDF letterhead shared by every printed document (minutes, financial
statements, donation statements, rosters), so set it before generating any documents.

Upload the church **logo** here too (PNG or JPEG, up to 5 MB) — it renders at the top of
that same letterhead.

### 4. Review reference data

The seed ships sensible Brazilian defaults; review and adjust them in-app:

| What                | Where                                        |
| ------------------- | -------------------------------------------- |
| Payment methods     | **Formas de Pagamento** (`/payment-methods`) |
| Income categories   | **Categorias** (`/income-categories`)        |
| Expense categories  | **Categorias** (`/expense-categories`)       |
| Campaigns / funds   | **Campanhas** (`/designated-funds`)          |
| Roles & permissions | **Cargos** (`/roles`)                        |

### 5. Set the opening balance

The system-wide **opening balance** (`finance_settings.opening_balance`) is the base
the very first monthly closing builds on. The seed initialises it to `0.00`.

Set it in-app on the **Configurações da Igreja** page, in the **Saldo inicial** card
(gated by the same `Dados da Igreja` permission as the rest of that page). If the church
starts with a non-zero balance, enter it before the first closing.

> Once the first monthly closing is marked **fechado**, the opening balance is frozen —
> editing it would desync an already-closed period. Only an **Administrador** can still
> change it afterwards, as an escape hatch for correcting a day-one mistake.

### 6. Add users and approve registrations

- **Admin-created users** (**Usuários**, `/users`): created active, with permissions
  copied from the assigned role; can be linked to a member record.
- **Self-registration** (`/register`): lands in status `pendente` with the `Congregado`
  role and no permissions until an admin approves it from the Usuários page.

## Common commands

```bash
pnpm dev                                  # start all apps
pnpm --filter @sistema-ibanje/api dev     # API only
pnpm --filter @sistema-ibanje/web dev     # web only

pnpm lint                                 # lint everything
pnpm format                              # format everything
```

## API stack

| Tool                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| Fastify 5                 | HTTP framework                       |
| Drizzle ORM + postgres.js | Database access (PostgreSQL 18)      |
| Zod v4                    | Schema validation                    |
| @fastify/session + Redis  | Session-based auth                   |
| MinIO                     | Receipt file storage (S3-compatible) |
| @react-pdf/renderer       | PDF report generation                |

## Web stack

| Tool              | Purpose                                       |
| ----------------- | --------------------------------------------- |
| React 19 + Vite 8 | UI + bundler                                  |
| Tailwind CSS v4   | Styling (CSS-first, no config file)           |
| shadcn/ui         | Component library (new-york style, zinc base) |
| TanStack Query v5 | Server state and caching                      |
| React Router v7   | Client-side routing                           |
| React Compiler    | Auto-memoization via Babel plugin             |

### Adding shadcn components

From the `apps/web` directory:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog form input label select table
```

Components are copied into `src/components/ui/` as plain `.tsx` files you own and edit directly.

### Path alias

`@/` maps to `apps/web/src/`. Use it for all internal imports:

```ts
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
```

### API client

`src/lib/api.ts` provides typed `get`, `post`, `patch`, `delete` helpers that handle CSRF automatically:

```ts
import { api } from '@/lib/api';

const members = await api.get<Member[]>('/members');
await api.post('/members', { name: 'João' });
```

## Environment

Copy the root `.env` file and adjust as needed — it is shared by Docker Compose and the API.
