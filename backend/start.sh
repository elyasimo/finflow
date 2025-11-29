#!/bin/sh
set -euo pipefail

echo "🔄 Running database migrations..."

# Prefer DATABASE_URL if available (handles host, port, user, password)
if [ -n "${DATABASE_URL-}" ]; then
  echo "Using DATABASE_URL to wait for Postgres readiness"
  # Wait until psql can connect
  until psql "$DATABASE_URL" -c '\q' >/dev/null 2>&1; do
    echo "⏳ Waiting for PostgreSQL (via DATABASE_URL)..."
    sleep 2
  done
else
  echo "DATABASE_URL not set, falling back to PG_HOST/PG_PORT/PG_USER checks"
  : "${DB_HOST:?DB_HOST must be set}", : "${DB_PORT:?DB_PORT must be set}", : "${DB_USER:?DB_USER must be set}"
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
    echo "⏳ Waiting for PostgreSQL ($DB_HOST:$DB_PORT)..."
    sleep 2
  done
fi

echo "✅ PostgreSQL is ready"
echo "📦 Applying database schema (applying SQL migrations from ./drizzle/migrations)..."

# If drizzle migrations exist as SQL files, apply them with psql after removing any
# interactive markers ("--> statement-breakpoint") that the generator may have inserted.
if [ -d "./drizzle/migrations" ]; then
  for f in ./drizzle/migrations/*.sql; do
    [ -e "$f" ] || continue
    echo "Applying migration: $f"
    # remove any statement-breakpoint markers then execute
    sed '/statement-breakpoint/d' "$f" | psql "$DATABASE_URL" || {
      echo "❌ applying $f failed"
      exit 1
    }
  done
else
  echo "No migration directory found, attempting drizzle-kit push as fallback"
  if ! npx drizzle-kit push --config=./drizzle.config.ts; then
    echo "❌ drizzle-kit push failed"
    exit 1
  fi
fi

echo "✅ Migrations completed"

# Verify critical tables exist before starting the app to avoid runtime errors
check_table_exists() {
  TABLE_NAME="$1"
  if [ -n "${DATABASE_URL-}" ]; then
    EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.$TABLE_NAME');" 2>/dev/null || true)
  else
    # Fall back to using psql with host/user/port/db passed via env vars
    PSQL_CONN="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    EXISTS=$(psql $PSQL_CONN -tAc "SELECT to_regclass('public.$TABLE_NAME');" 2>/dev/null || true)
  fi

  if [ -z "$EXISTS" ] || [ "$EXISTS" = "" ] || [ "$EXISTS" = "(0 rows)" ]; then
    echo "❌ Required table '$TABLE_NAME' does not exist"
    return 1
  fi
  echo "✅ Table '$TABLE_NAME' exists"
  return 0
}

# List critical tables to validate; add more names if there are other required tables
CRITICAL_TABLES="price_alerts users accounts transactions"
for t in $CRITICAL_TABLES; do
  if ! check_table_exists "$t"; then
    echo "Migration verification failed: missing table $t"
    exit 1
  fi
done

echo "🚀 Starting application..."

# Seed default admin user if not exists (using JS for correct bcrypt hashing)
if [ -f "./scripts/seed-admin.js" ]; then
  echo "👤 Checking for default admin user..."
  node ./scripts/seed-admin.js || echo "Admin seed skipped or failed"
fi

exec node dist/server.js
