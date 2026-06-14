#!/bin/sh
# Backup verification — "a backup never restored is not a backup".
#
# Pulls the most recent dump from the MinIO backup bucket, restores it into a throwaway database on
# the same Postgres server, and asserts the restore is structurally sound. Designed to run in the
# same context as scripts/backup.sh (the `backup` container: has `mc` + the Postgres client + the
# POSTGRES_* / MINIO_* / BACKUP_BUCKET env vars). Schedule it a few hours after the nightly backup.
#
# Exit codes: 0 = verified, non-zero = something is wrong (no backups, restore error, or a structural
# table came back empty — i.e. a silently corrupt dump). Wire the non-zero exit to your alerting.
set -eu

ALIAS=local
VERIFY_DB="verify_restore_$(date -u +%s)"
WORK_DIR=$(mktemp -d)

psql_admin() {
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

count_in_verify() {
  PGPASSWORD="$POSTGRES_PASSWORD" psql -tAc "SELECT count(*) FROM $1;" \
    -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$VERIFY_DB" 2>/dev/null | tr -d '[:space:]'
}

# Always clean up the throwaway DB and temp files, even on failure.
cleanup() {
  rm -rf "$WORK_DIR"
  psql_admin -c "DROP DATABASE IF EXISTS \"$VERIFY_DB\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

mc alias set "$ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null

# Backup object names are YYYY-MM-DD.sql.gz, so lexical sort == chronological; tail -1 is newest.
LATEST=$(mc ls "$ALIAS/$BACKUP_BUCKET/" | awk '{print $NF}' \
  | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}\.sql\.gz$' | sort | tail -1)
if [ -z "$LATEST" ]; then
  echo "[verify] $(date -u -Iseconds) FAIL no backups found in $BACKUP_BUCKET" >&2
  exit 1
fi

mc cp "$ALIAS/$BACKUP_BUCKET/$LATEST" "$WORK_DIR/dump.sql.gz" >/dev/null

# Throwaway database on the same server (dropped by the trap, even on failure).
psql_admin -c "CREATE DATABASE \"$VERIFY_DB\";" >/dev/null

# Restore with ON_ERROR_STOP so any SQL error fails the run. The dump is --clean --if-exists, so the
# leading DROPs are harmless no-ops against a fresh database; --no-owner keeps ownership statements out.
if ! gunzip -c "$WORK_DIR/dump.sql.gz" | PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 \
    -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$VERIFY_DB" >/dev/null 2>"$WORK_DIR/restore.err"; then
  echo "[verify] $(date -u -Iseconds) FAIL restore errored for $LATEST" >&2
  tail -n 5 "$WORK_DIR/restore.err" >&2 || true
  exit 1
fi

# Structural tables MUST have rows — an empty one means the dump is corrupt/truncated even though the
# restore "succeeded". Seed/reference data guarantees these are populated on any real database.
FAILED=0
for t in users roles modules permissions; do
  n=$(count_in_verify "$t")
  if [ -z "$n" ] || [ "$n" -lt 1 ] 2>/dev/null; then
    echo "[verify] $(date -u -Iseconds) FAIL structural table '$t' is empty (count=${n:-error})" >&2
    FAILED=1
  else
    echo "[verify] structural $t=$n"
  fi
done

# Data tables are informational — a young church legitimately has zero finance rows, so we report
# but never fail on these.
for t in attenders income_entries expense_entries monthly_closings audit_log; do
  echo "[verify] data $t=$(count_in_verify "$t")"
done

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "[verify] $(date -u -Iseconds) ok restored+verified $LATEST"
