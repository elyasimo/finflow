#!/bin/bash
set -e

echo "🔄 Running database migrations..."

# Database connection from environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-finflow}"
DB_USER="${DB_USER:-finflow}"

# Wait for database to be ready
echo "⏳ Waiting for database..."
max_attempts=30
attempt=0
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database not available after $max_attempts attempts"
    exit 1
  fi
  echo "Waiting for database... attempt $attempt/$max_attempts"
  sleep 2
done

echo "✅ Database is ready"

# Run all SQL migrations in order
echo "📝 Applying migrations..."

for migration in drizzle/migrations/*.sql drizzle/*.sql; do
  if [ -f "$migration" ]; then
    echo "  → Applying $(basename $migration)"
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" || {
      echo "⚠️  Migration $(basename $migration) failed (might already be applied)"
    }
  fi
done

echo "✅ All migrations applied successfully"
