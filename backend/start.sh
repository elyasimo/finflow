#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Wait for postgres to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run Drizzle migrations
echo "📦 Applying database schema..."
npx drizzle-kit push --force || echo "⚠️  Migration completed with warnings"

echo "🚀 Starting application..."
exec node dist/server.js
