# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS builder
ENV CI=true
RUN corepack enable
WORKDIR /repo

# Copy lockfile + workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm fetch

# Now copy source and install (offline from the fetched store).
COPY tsconfig.base.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile --prefer-offline

# Build shared first (web depends on its types via workspace link), then web.
RUN pnpm --filter @sistema-ibanje/shared build
RUN pnpm --filter @sistema-ibanje/web build

# ---------- runtime: nginx serves the SPA + proxies /api/* to api:3000 ----------
FROM nginx:alpine AS runtime
RUN apk add --no-cache su-exec && \
    addgroup -S appuser && \
    adduser -S appuser -G appuser && \
    rm -rf /usr/share/nginx/html/* && \
    chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run /run
COPY --from=builder /repo/apps/web/dist/ /usr/share/nginx/html/
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
USER appuser
CMD ["nginx", "-g", "daemon off;"]
