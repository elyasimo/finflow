#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Wait for postgres to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready"
echo "📦 Applying database schema..."

# Run migration with local drizzle-kit
npx drizzle-kit push --config=./drizzle.config.ts

echo "✅ Migrations completed"
echo "🚀 Starting application..."
exec node dist/server.js
