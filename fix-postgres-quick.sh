#!/bin/bash
# QUICK FIX: Postgres User und Passwort reparieren

POSTGRES_CONTAINER="postgres-pskgoosgk484o0kos04ksoss-202230869684"
PASSWORD="finflow_production_2025"

echo "🔍 Schritt 1: Prüfe welche User existieren..."
docker exec $POSTGRES_CONTAINER sh -c 'psql -U $POSTGRES_USER -d postgres -c "\du"' 2>&1

echo ""
echo "🛠️  Schritt 2: Erstelle/Ändere User finflow_prod mit korrektem Passwort..."
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"ALTER USER finflow_prod WITH PASSWORD '$PASSWORD';\"" 2>&1 || \
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"CREATE USER finflow_prod WITH PASSWORD '$PASSWORD';\"" 2>&1

echo ""
echo "🛠️  Schritt 3: Erstelle postgres Superuser falls nicht vorhanden..."
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD '$PASSWORD';\"" 2>&1 || \
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"ALTER USER postgres WITH PASSWORD '$PASSWORD';\"" 2>&1

echo ""
echo "🛠️  Schritt 4: Erstelle Datenbank falls nicht vorhanden..."
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"CREATE DATABASE finflow_production OWNER finflow_prod;\"" 2>&1 || echo "Datenbank existiert bereits"

echo ""
echo "🛠️  Schritt 5: Setze Rechte..."
docker exec $POSTGRES_CONTAINER sh -c "psql -U \$POSTGRES_USER -d postgres -c \"GRANT ALL PRIVILEGES ON DATABASE finflow_production TO finflow_prod;\"" 2>&1

echo ""
echo "✅ Schritt 6: Teste Verbindung mit neuem Passwort..."
docker exec $POSTGRES_CONTAINER sh -c "PGPASSWORD='$PASSWORD' psql -h localhost -U finflow_prod -d finflow_production -c 'SELECT version();'" 2>&1

echo ""
echo "==========================================="
echo "Falls oben Version angezeigt wurde: ERFOLG!"
echo "Starte nun API neu: docker restart api-pskgoosgk484o0kos04ksoss-202230895415"
echo "==========================================="
