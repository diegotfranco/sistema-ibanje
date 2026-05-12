# Deploy runbook — Sistema Ibanje

One-page guide for deploying the production stack. Stack: Nginx (web) + Fastify (api) + Postgres + Redis + MinIO + nightly backup container.

## Prerequisites

- Linux server with Docker Engine ≥ 25 and Docker Compose plugin (v2).
- Outbound network for Resend (transactional email) and Docker registry pulls.
- A reverse proxy (Caddy / Traefik / Cloudflare Tunnel) in front for TLS — production binds `web` to `:80`.
- DNS A record pointing to the server.
- `/opt/sistema-ibanje/{postgres,redis,minio}-data` will be created on first boot for persistent volumes. Make sure the server has enough disk for these.

## First-time bootstrap

```bash
git clone <repo-url> /opt/sistema-ibanje/app && cd /opt/sistema-ibanje/app
cp .env.production.example .env.production
# Edit .env.production — fill every CHANGE_ME secret. Generate strong values:
#   openssl rand -base64 48   (use this for SESSION_SECRET and ARGON2_PEPPER)

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Wait until postgres healthcheck is green, then run migrations + seed once:
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api pnpm db:migrate
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api pnpm db:seed
```

The seed creates the default admin user (`admin@email.com / admin123`). **Change this password immediately** by logging in and using the password change flow.

## Deploying a new version

```bash
cd /opt/sistema-ibanje/app
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build api web
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm api pnpm db:migrate
```

If the deploy is healthy, prune old images: `docker image prune -f`.

## Rollback

```bash
git checkout <previous-tag-or-commit>
docker compose -f docker-compose.prod.yml --env-file .env.production build api web
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Database rollback: see "Restore from backup" below.

## Offsite mirror — Cloudflare R2

If the R2 env vars are set in `.env.production` (`R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`), the backup container mirrors each daily dump to the R2 bucket after the local MinIO write. Failure to mirror is logged but does not fail the backup. Retention on R2 is managed by a bucket lifecycle rule (recommended: delete objects older than 90 days); local MinIO retention is independent (`BACKUP_RETAIN_DAYS`, default 30).

### Quarterly restore drill

A backup never restored is not a backup. Run this every ~3 months on a laptop (NOT the prod server):

```bash
mkdir -p /tmp/restore-drill && cd /tmp/restore-drill

# Pull yesterday's dump from R2 (use the S3 API endpoint, not the public bucket URL)
docker run --rm -v "$PWD:/data" minio/mc sh -c "
  mc alias set r2 $R2_ENDPOINT $R2_ACCESS_KEY $R2_SECRET_KEY &&
  mc cp r2/$R2_BUCKET/$(date -u -d yesterday +%Y-%m-%d).sql.gz /data/
"

# Throwaway Postgres
docker run -d --rm --name restore-test -e POSTGRES_PASSWORD=test -p 55432:5432 postgres:18-alpine
sleep 5
docker exec -e PGPASSWORD=test restore-test psql -U postgres -c "CREATE DATABASE restore_test;"

# Restore + sanity check
gunzip -c *.sql.gz | docker exec -i -e PGPASSWORD=test restore-test \
  psql -U postgres -d restore_test
docker exec -e PGPASSWORD=test restore-test psql -U postgres -d restore_test \
  -c "SELECT count(*) FROM members; SELECT count(*) FROM income_entries;"

docker stop restore-test
```

Counts must match production. Record the drill date in your notes.

## Restore from backup

Backups land in MinIO bucket `backups` daily at 02:00 UTC as `YYYY-MM-DD.sql.gz`. When R2 is configured, the same object is also in the R2 bucket.

```bash
# List available backups
docker compose -f docker-compose.prod.yml --env-file .env.production exec backup \
  mc ls local/backups

# Pull a specific backup
docker compose -f docker-compose.prod.yml --env-file .env.production exec backup \
  mc cp local/backups/2026-05-09.sql.gz /tmp/restore.sql.gz

# Restore (this WILL drop and recreate tables — pg_dump runs with --clean --if-exists)
docker compose -f docker-compose.prod.yml --env-file .env.production exec backup sh -c \
  "gunzip -c /tmp/restore.sql.gz | PGPASSWORD=\$POSTGRES_PASSWORD psql -h postgres -U \$POSTGRES_USER -d \$POSTGRES_DB"
```

## TLS

The production compose binds web to `:80`. Add TLS via:

- **Caddy** in front (single binary, automatic Let's Encrypt). Point Caddy at `localhost:80`.
- **Cloudflare Tunnel** (`cloudflared`) — connects without opening ports.
- **Traefik** if you already have a Docker reverse proxy stack.

Whichever route you pick, set `PUBLIC_URL=https://your-domain.com` in `.env.production` so CORS + email links emit the correct origin.

## Operational tips

- **Logs**: `docker compose -f docker-compose.prod.yml --env-file .env.production logs -f api`
- **MinIO console**: tunnel to `localhost:9001` over SSH (`ssh -L 9001:localhost:9001 server`) and log in with the MinIO access/secret keys.
- **Manual backup trigger**: `docker compose -f docker-compose.prod.yml --env-file .env.production exec backup /usr/local/bin/backup.sh`
- **Disk usage of volumes**: `du -sh /opt/sistema-ibanje/*-data`
