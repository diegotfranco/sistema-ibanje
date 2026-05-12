#!/bin/sh
set -eu

DATE=$(date -u +%Y-%m-%d)
DUMP_FILE="/tmp/${DATE}.sql.gz"
ALIAS=local

mc alias set "$ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
mc mb --ignore-existing "$ALIAS/$BACKUP_BUCKET" >/dev/null

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "$DUMP_FILE"

mc cp "$DUMP_FILE" "$ALIAS/$BACKUP_BUCKET/${DATE}.sql.gz"
rm -f "$DUMP_FILE"

if [ -n "${R2_ACCESS_KEY:-}" ] && [ -n "${R2_SECRET_KEY:-}" ] && [ -n "${R2_ENDPOINT:-}" ] && [ -n "${R2_BUCKET:-}" ]; then
  mc alias set r2 "$R2_ENDPOINT" "$R2_ACCESS_KEY" "$R2_SECRET_KEY" >/dev/null
  if mc cp "$ALIAS/$BACKUP_BUCKET/${DATE}.sql.gz" "r2/$R2_BUCKET/${DATE}.sql.gz"; then
    echo "[backup] $(date -u -Iseconds) r2-mirror ok ${DATE}.sql.gz"
  else
    echo "[backup] $(date -u -Iseconds) WARN r2-mirror failed ${DATE}.sql.gz" >&2
  fi
fi

NOW_EPOCH=$(date -u +%s)
CUTOFF_EPOCH=$((NOW_EPOCH - BACKUP_RETAIN_DAYS * 86400))
CUTOFF=$(date -u -d "@${CUTOFF_EPOCH}" +%Y-%m-%d)

mc ls "$ALIAS/$BACKUP_BUCKET/" | awk '{print $NF}' | while read -r OBJ; do
  KEY=${OBJ%.sql.gz}
  case "$KEY" in
    [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9])
      if [ "$KEY" \< "$CUTOFF" ]; then
        mc rm "$ALIAS/$BACKUP_BUCKET/$OBJ"
      fi
      ;;
  esac
done

echo "[backup] $(date -u -Iseconds) ok ${DATE}.sql.gz"
