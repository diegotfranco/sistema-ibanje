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
