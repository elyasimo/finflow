#!/bin/bash
# Finflow Production - Run Database Migrations
# Dieses Script führt alle Drizzle Migrations manuell aus

set -e  # Stop bei Fehler

API_CONTAINER=$(docker ps -q --filter "name=api-pskgoosgk484o0kos04ksoss")
POSTGRES_CONTAINER=$(docker ps -q --filter "name=postgres-pskgoosgk484o0kos04ksoss")

echo "📦 API Container: $API_CONTAINER"
echo "🗄️  PostgreSQL Container: $POSTGRES_CONTAINER"
echo ""

if [ -z "$API_CONTAINER" ] || [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Container nicht gefunden!"
    exit 1
fi

echo "🚀 Starte Migrations..."
echo ""

# Migration 0000
echo "▶️  Migration 0000..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0000_volatile_morg.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0001
echo "▶️  Migration 0001..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0001_real_tana_nile.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0002
echo "▶️  Migration 0002..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0002_brown_union_jack.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0003
echo "▶️  Migration 0003..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0003_flimsy_magdalene.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0004
echo "▶️  Migration 0004..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0004_uneven_mercury.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0005
echo "▶️  Migration 0005..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0005_sour_punisher.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0006 - OTP Verifications Table
echo "▶️  Migration 0006 (otp_verifications)..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0006_grey_squadron_sinister.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration add-encrypted-api-keys
echo "▶️  Migration add-encrypted-api-keys..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/add-encrypted-api-keys.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0008
echo "▶️  Migration 0008 (price_alerts)..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0008_init_price_alerts.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

# Migration 0009 - Admin User Fields
echo "▶️  Migration 0009 (admin_user_fields)..."
docker exec $API_CONTAINER cat /app/drizzle/migrations/0009_add_user_admin_fields.sql | \
    docker exec -i $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production

echo ""
echo "✅ Alle Migrations erfolgreich ausgeführt!"
echo ""

# Zeige Tabellen
echo "📊 Tabellen in der Datenbank:"
docker exec $POSTGRES_CONTAINER psql -U finflow_prod -d finflow_production -c "\dt"

echo ""
echo "🔄 Starte API Container neu..."
docker restart $API_CONTAINER

echo "⏳ Warte 15 Sekunden..."
sleep 15

echo ""
echo "📋 API Logs:"
docker logs $API_CONTAINER --tail 25

echo ""
echo "🎉 Fertig! Prüfe ob die API läuft:"
echo "   https://api.finflowapp.ch/health"
