#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Wait for postgres to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run Drizzle migrations using local drizzle-kit (should be in node_modules)
echo "📦 Applying database schema..."
cd /app

# Verify drizzle config exists
if [ -f "drizzle.config.ts" ]; then
  echo "✅ Found drizzle.config.ts"
else
  echo "❌ drizzle.config.ts not found!"
  ls -la | grep drizzle || echo "No drizzle files found"
fi

# Run migration with explicit config path
node_modules/.bin/drizzle-kit push --config=./drizzle.config.ts || {
  echo "⚠️  Migration failed, trying with tsx..."
  npx tsx node_modules/drizzle-kit/bin.cjs push --config=./drizzle.config.ts
}

echo "🚀 Starting application..."
exec node dist/server.js
