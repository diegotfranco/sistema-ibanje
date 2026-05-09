# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV CI=true
RUN corepack enable
WORKDIR /repo

# ---------- builder ----------
FROM base AS builder
# Native deps for argon2 etc.
RUN apk add --no-cache python3 make g++

# Copy lockfile + workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm fetch

# Now copy source and install (offline from the fetched store).
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

# Build shared first (api depends on it), then api.
RUN pnpm --filter @sistema-ibanje/shared build
RUN pnpm --filter @sistema-ibanje/api build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production

# Argon2 needs the runtime libstdc++ on alpine; tini for proper PID 1 signal handling.
RUN apk add --no-cache libstdc++ tini

# Copy the whole built workspace. Image size is acceptable for this project,
# and keeping drizzle-kit + tsx in-image lets `pnpm db:migrate` / `db:seed`
# run via `docker compose run --rm api ...` for ops.
COPY --from=builder --chown=node:node /repo /repo

WORKDIR /repo/apps/api
USER node

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/app.js"]
