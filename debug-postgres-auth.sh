#!/bin/bash
# Debug-Script für PostgreSQL Auth-Problem in Coolify
# Führe dies auf dem VPS aus und kopiere die komplette Ausgabe

# Korrekte Container-Namen aus docker ps
POSTGRES_CONTAINER="postgres-pskgoosgk484o0kos04ksoss-202230869684"
API_CONTAINER="api-pskgoosgk484o0kos04ksoss-202230895415"

echo "==================== 1. POSTGRES: Liste aller Datenbank-User ===================="
docker exec -it $POSTGRES_CONTAINER psql -U postgres -c "\du"

echo ""
echo "==================== 2. POSTGRES: pg_hba.conf Inhalt ===================="
docker exec -it $POSTGRES_CONTAINER cat /var/lib/postgresql/data/pg_hba.conf || echo "FEHLER: pg_hba.conf nicht lesbar"

echo ""
echo "==================== 3. API: Alle DB-relevanten ENV-Variablen ===================="
docker exec -it $API_CONTAINER sh -c 'env | grep -iE "db|postgres|database" | sort'

echo ""
echo "==================== 4. API: DATABASE_URL im Detail (inkl. versteckte Zeichen) ===================="
docker exec -it $API_CONTAINER sh -c 'echo -n "$DATABASE_URL" | od -c'

echo ""
echo "==================== 5. API: Mounts (prüft ob Secrets als Dateien gemountet sind) ===================="
docker inspect $API_CONTAINER --format '{{json .Mounts}}' | python3 -m json.tool || docker inspect $API_CONTAINER --format '{{json .Mounts}}'

echo ""
echo "==================== 6. POSTGRES: Mounts ===================="
docker inspect $POSTGRES_CONTAINER --format '{{json .Mounts}}' | python3 -m json.tool || docker inspect $POSTGRES_CONTAINER --format '{{json .Mounts}}'

echo ""
echo "==================== 7. POSTGRES: Letzte 50 Zeilen Logs ===================="
docker logs $POSTGRES_CONTAINER --tail 50

echo ""
echo "==================== 8. API: Letzte 100 Zeilen Logs ===================="
docker logs $API_CONTAINER --tail 100

echo ""
echo "==================== 9. NETZWERK: Können API und Postgres sich erreichen? ===================="
docker exec -it $API_CONTAINER sh -c 'ping -c 2 postgres || echo "FEHLER: postgres hostname nicht erreichbar"'
docker exec -it $API_CONTAINER sh -c 'ping -c 2 postgres-pskgoosgk484o0kos04ksoss-202230869684 || echo "FEHLER: postgres-pskgoosgk484o0kos04ksoss-202230869684 nicht erreichbar"'
docker exec -it $API_CONTAINER sh -c 'nc -zv postgres 5432 2>&1 || echo "FEHLER: Port 5432 auf postgres nicht offen"'

echo ""
echo "==================== 10. DIREKTER VERBINDUNGSTEST aus API-Container ===================="
docker exec -it $API_CONTAINER sh -c 'node -e "const {Client}=require(\"pg\");(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});try{await c.connect();console.log(\"✅ ERFOLG:\",await c.query(\"select version()\"));await c.end();}catch(e){console.error(\"❌ FEHLER:\",e.message,e.code);}})()"'

echo ""
echo "==================== 11. TEST: Verbindung mit EXPLIZITEM Passwort ===================="
echo "Teste ob postgres:5432 mit User finflow_prod und Passwort aus deiner DATABASE_URL funktioniert..."
docker exec -it $API_CONTAINER sh -c 'PGPASSWORD="XPXNBPM1IAsyJFNaGGqMXjh2dr300dMQU47aZam1VAU" psql -h postgres -p 5432 -U finflow_prod -d finflow_production -c "SELECT 1 as test;"' || echo "FEHLER: Direkter psql-Connect fehlgeschlagen"

echo ""
echo "==================== FERTIG ===================="
echo "Bitte kopiere die komplette Ausgabe und füge sie in den Chat ein."
