# ===============================
# Finflow - Coolify Deployment Guide
# ===============================
# VPS + Coolify + Docker Compose
# ===============================

## 🚀 Deployment Steps für Coolify

### 1. VPS Vorbereitung (einmalig)

**Empfohlene VPS Specs:**
- **CPU:** 2 vCPUs minimum (4 vCPUs empfohlen)
- **RAM:** 4 GB minimum (8 GB empfohlen)
- **Storage:** 40 GB SSD minimum
- **OS:** Ubuntu 22.04 LTS
- **Provider:** Hetzner, DigitalOcean, Linode, Vultr

**Coolify installieren:**
```bash
# SSH in deinen VPS
ssh root@your-vps-ip

# Coolify installieren (automatisches Setup)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Nach Installation erreichbar unter:
# http://your-vps-ip:8000
```

**WICHTIG für Production:**
- Coolify nutzt dein existierendes `docker-compose.yml`
- Alle Environment Variables werden von Coolify injiziert (aus `.env.production`)
- `NODE_ENV=production` aktiviert Production-Modus
- PostgreSQL läuft in Production mit starken Credentials
- Coolify handhabt SSL/TLS Zertifikate automatisch

---

### 2. Finflow in Coolify deployen

#### Option A: GitHub Repository (empfohlen)

1. **Repository zu Coolify hinzufügen:**
   - Coolify öffnen → "Resources" → "New Resource"
   - "Docker Compose" auswählen
   - GitHub Repository verbinden
   - Branch: `main` oder `production`

2. **Deployment Konfiguration:**
   - **Docker Compose File:** `docker-compose.yml` (Standard-Datei)
   - **Build Pack:** Docker Compose
   - **Auto Deploy:** aktivieren (bei Git Push)

#### Option B: Manueller Upload

1. **Projekt-Ordner zippen:**
```bash
# Auf lokalem Mac
cd /Users/khalidbakhtaoui/Documents/Workspace/FInance-manager
tar -czf finflow-deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=backend/node_modules \
  --exclude=backend/dist \
  --exclude=postgres-data \
  --exclude=.git \
  .
```

2. **In Coolify hochladen:**
   - "Simple Dockerfile" → "Upload Source"
   - `finflow-deployment.tar.gz` hochladen
   - Docker Compose File: `docker-compose.yml`

---

### 3. Environment Variables in Coolify setzen

**In Coolify Dashboard → Environment Variables:**

Kopiere den kompletten Inhalt aus `.env.production` in Coolify:

```bash
# Datei anzeigen
cat .env.production
```

**WICHTIG - Folgende Werte nach Deployment anpassen:**

```env
# 1. NODE_ENV auf production setzen
NODE_ENV=production

# 2. Database auf Production umstellen
POSTGRES_USER=finflow_prod
POSTGRES_PASSWORD=XPXNBPM1IAsyJFNaGGqMXjh2dr300dMQU47aZam1VAU=
POSTGRES_DB=finflow_production

# 3. CORS_ORIGIN mit deiner Domain ersetzen
CORS_ORIGIN=https://finflow.deinedomain.com,https://app.deinedomain.com

# 4. NEXT_PUBLIC_API_URL setzen (für Frontend)
NEXT_PUBLIC_API_URL=https://api.deinedomain.com

# 5. Neue Binance API Keys erstellen und eintragen
BINANCE_API_KEY=NEUER_KEY_MIT_IP_WHITELIST
BINANCE_API_SECRET=NEUER_SECRET

# 6. Neue Alpaca API Keys erstellen und eintragen
ALPACA_API_KEY=NEUER_ALPACA_KEY
ALPACA_API_SECRET=NEUER_ALPACA_SECRET
```

---

### 4. Domain & SSL Konfiguration

**In Coolify:**

1. **Domain hinzufügen:**
   - Gehe zu deinem Service → "Domains"
   - Frontend: `app.deinedomain.com` → Port 3000
   - Backend API: `api.deinedomain.com` → Port 8080

2. **SSL/TLS (automatisch):**
   - Coolify generiert automatisch Let's Encrypt Zertifikate
   - Aktiviere "Force HTTPS Redirect"

3. **DNS Einträge (bei Domain-Provider):**
```
A Record:  app.deinedomain.com  →  YOUR_VPS_IP
A Record:  api.deinedomain.com  →  YOUR_VPS_IP
```

**Warte 5-10 Minuten** bis DNS propagiert ist.

---

### 5. Deployment starten

1. **In Coolify → "Deploy"**
2. **Logs überwachen:**
   - Build Logs: Compilation Prozess
   - Runtime Logs: Server Start & Migrations

**Erfolgreiche Logs sollten zeigen:**
```
✅ Database migrations completed
✅ WebSocket server initialized
🚀 Finflow API running on http://0.0.0.0:8080
🔔 Price alerts monitor started
```

---

### 6. Nach Deployment - Sicherheits-Checklist

#### A. Neue Binance API Keys erstellen

1. Gehe zu: https://www.binance.com/en/my/settings/api-management
2. **LÖSCHE alte Keys** (jquHsf...490C)
3. **Erstelle NEUE Keys** mit:
   - ✅ Enable Reading
   - ❌ Disable Enable Trading (nur wenn wirklich nötig)
   - ❌ Disable Enable Withdrawals
   - ✅ **IP Restriction:** Trage VPS IP ein (KRITISCH!)
4. **Update in Coolify Environment Variables**

#### B. Neue Alpaca API Keys erstellen

1. Gehe zu: https://app.alpaca.markets/paper/dashboard/overview
2. **Regenerate** Paper Trading Keys
3. **Update in Coolify Environment Variables**

#### C. Firewall konfigurieren (UFW)

```bash
# SSH in VPS
ssh root@your-vps-ip

# Firewall aktivieren
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # HTTP (Coolify Redirect)
ufw allow 443/tcp       # HTTPS
ufw allow 8000/tcp      # Coolify Dashboard
ufw enable

# PostgreSQL nur intern (NICHT öffnen!)
# ufw deny 5432/tcp
```

#### D. PostgreSQL Backup einrichten

```bash
# Automatisches Backup Script (täglich 3 Uhr)
cat > /root/backup-finflow-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/finflow"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

docker exec finflow-postgres-prod pg_dump -U finflow_prod finflow_production | \
  gzip > $BACKUP_DIR/finflow_backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "finflow_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /root/backup-finflow-db.sh

# Cronjob hinzufügen
crontab -e
# Füge hinzu:
0 3 * * * /root/backup-finflow-db.sh
```

---

### 7. Health Checks & Monitoring

**Coolify bietet eingebaute Health Checks:**

- Frontend Health: `https://app.deinedomain.com/`
- Backend Health: `https://api.deinedomain.com/health`

**Health Check Response (sollte sein):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T...",
  "uptime": 12345,
  "database": "connected"
}
```

**Monitoring Setup (optional):**
- Coolify Dashboard zeigt CPU/RAM/Network
- Uptime Monitoring: UptimeRobot (kostenlos)
- Logs: Coolify built-in Logs Viewer

---

### 8. Datenbank Management

**pgAdmin Zugriff (optional, nur Development):**

1. **In docker-compose.production.yml** pgAdmin Service hinzufügen (falls gewünscht)
2. **Oder CLI Zugriff:**
```bash
# SSH in VPS
ssh root@your-vps-ip

# PostgreSQL CLI
docker exec -it finflow-postgres-prod psql -U finflow_prod -d finflow_production

# Queries ausführen
SELECT COUNT(*) FROM users;
SELECT * FROM price_alerts WHERE active = true;
```

---

### 9. Updates & Rollback

**Updates deployen:**

1. **Git Push zu Repository** (bei GitHub Integration)
   - Coolify deployed automatisch

2. **Oder manuell in Coolify:**
   - "Redeploy" Button klicken
   - Wähle Branch/Tag

**Rollback bei Problemen:**

1. Coolify → "Deployments History"
2. Wähle vorherige erfolgreiche Version
3. "Rollback" klicken

---

### 10. Performance Optimierung

**Docker Compose Ressourcen Limits:**

In `docker-compose.production.yml` (optional):

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
  
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

**PostgreSQL Tuning:**

```bash
# In docker-compose.production.yml unter postgres service:
environment:
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
  POSTGRES_MAX_CONNECTIONS: 100
```

---

## 🎯 Deployment Checklist

Vor dem Go-Live:

- [ ] VPS bereit (4GB RAM minimum)
- [ ] Coolify installiert
- [ ] Domain registriert & DNS konfiguriert
- [ ] `.env.production` in Coolify hochgeladen
- [ ] `CORS_ORIGIN` auf richtige Domain gesetzt
- [ ] Neue Binance API Keys erstellt (mit IP Whitelist)
- [ ] Neue Alpaca API Keys erstellt
- [ ] Deployment erfolgreich (Logs prüfen)
- [ ] SSL Zertifikate aktiv (HTTPS funktioniert)
- [ ] Health Check OK (`/health` Endpoint)
- [ ] Firewall konfiguriert (UFW)
- [ ] Backup Cronjob eingerichtet
- [ ] Erste Admin User angelegt
- [ ] Monitoring Setup (UptimeRobot)

---

## 🆘 Troubleshooting

### Problem: Database Connection Failed

```bash
# Prüfe PostgreSQL Container
docker ps | grep postgres
docker logs finflow-postgres-prod

# Teste Verbindung
docker exec -it finflow-postgres-prod psql -U finflow_prod -d finflow_production -c "SELECT 1"
```

### Problem: API nicht erreichbar

```bash
# Prüfe API Logs
docker logs finflow-api-prod --tail 100

# Teste intern
docker exec -it finflow-api-prod curl http://localhost:8080/health

# Prüfe Networking
docker network inspect finflow-network
```

### Problem: Frontend zeigt API Fehler

- Prüfe `NEXT_PUBLIC_API_URL` in Environment Variables
- Sollte auf `https://api.deinedomain.com` zeigen (nicht localhost!)
- CORS_ORIGIN muss Frontend Domain enthalten

### Problem: Migrations schlagen fehl

```bash
# Manuell Migrations ausführen
docker exec -it finflow-api-prod npm run migrate

# Oder direkt SQL
docker exec -it finflow-postgres-prod psql -U finflow_prod -d finflow_production -f /path/to/migration.sql
```

---

## 📊 Geschätzte Kosten

**VPS (Hetzner Beispiel):**
- CPX31 (4 vCPU, 8GB RAM): ~12€/Monat
- CX21 (2 vCPU, 4GB RAM): ~6€/Monat (Minimum)

**Domain:**
- .com Domain: ~10-15€/Jahr

**SSL:** Kostenlos (Let's Encrypt via Coolify)

**Total:** ~15-25€/Monat je nach VPS Größe

---

## 🎓 Nächste Schritte nach Deployment

1. ✅ Test Account erstellen und Login testen
2. ✅ Binance/Alpaca Integration testen
3. ✅ Price Alerts testen
4. ✅ Mobile Responsiveness prüfen
5. 🚀 Mobile App Development starten (iOS/Android)

---

## 🔗 Hilfreiche Links

- Coolify Docs: https://coolify.io/docs
- Hetzner VPS: https://www.hetzner.com/cloud
- Let's Encrypt: https://letsencrypt.org
- Binance API: https://www.binance.com/en/binance-api
- Alpaca API: https://alpaca.markets

---

**Viel Erfolg beim Deployment! 🚀**

Bei Fragen während der Installation, frag einfach!
