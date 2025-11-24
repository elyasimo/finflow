# 📋 DEPLOYMENT CHEAT SHEET - Auf einen Blick

---

## ✏️ SCHRITT 1: Nur 1 Zeile ändern!

```bash
# Öffne: .env.production
# Finde: DOMAIN_NAME=yourdomain.com
# Ändere zu: DOMAIN_NAME=deine-echte-domain.com

# Beispiel:
DOMAIN_NAME=finflow.app
```

**⏱️ Zeit:** 1 Minute  
**✅ FERTIG!** Alles andere ist automatisch!

---

## 🚀 SCHRITT 2: Coolify Deployment

### A) Environment Variables hochladen

```bash
Coolify Dashboard
  → Environment Variables
  → Bulk Edit
  → Paste KOMPLETTE .env.production
  → Save
```

⏱️ **Zeit:** 2 Minuten

---

### B) Domains konfigurieren

```bash
Coolify Dashboard → Domains:

1. Frontend:
   Domain: finflow.DEINE-DOMAIN
   Port: 3000
   SSL: ✓ Enable

2. Backend:
   Domain: api.DEINE-DOMAIN
   Port: 8080
   SSL: ✓ Enable
```

⏱️ **Zeit:** 3 Minuten

---

### C) DNS konfigurieren

```bash
Bei deinem Domain Provider:

A Record: finflow.DEINE-DOMAIN → VPS_IP
A Record: api.DEINE-DOMAIN → VPS_IP

# Beispiel:
A Record: finflow.finflow.app → 95.217.123.45
A Record: api.finflow.app → 95.217.123.45
```

⏱️ **Zeit:** 2 Minuten (+ 5-10 Min DNS Propagation)

---

### D) Deploy Button klicken!

```bash
Coolify Dashboard
  → Deploy Button
  → Warte ~10 Minuten
  → ✅ Done!
```

⏱️ **Zeit:** 10 Minuten

---

## ✅ SCHRITT 3: Testen

```bash
# Health Check:
https://api.DEINE-DOMAIN/health

# Frontend:
https://finflow.DEINE-DOMAIN

# Register → Login → Test Features
```

⏱️ **Zeit:** 5 Minuten

---

## 📊 WAS IST AUTOMATISCH KONFIGURIERT

### ✅ Aus `DOMAIN_NAME` generiert:

| Variable | Wert |
|----------|------|
| `CORS_ORIGIN` | `https://finflow.${DOMAIN_NAME},https://api.${DOMAIN_NAME}` |
| `NEXT_PUBLIC_API_URL` | `https://api.${DOMAIN_NAME}` |

### ✅ Bereits stark generiert:

| Secret | Stärke | Status |
|--------|--------|--------|
| JWT_SECRET | 86 chars | ✅ Stark |
| ENCRYPTION_MASTER_KEY | 64 chars | ✅ Stark |
| POSTGRES_PASSWORD | 44 chars | ✅ Stark |
| ALPACA_API_KEY | 44 chars | ✅ Platzhalter (stark) |
| ALPACA_API_SECRET | 64 chars | ✅ Platzhalter (stark) |
| BINANCE_API_KEY | 44 chars | ✅ Platzhalter (stark) |
| BINANCE_API_SECRET | 64 chars | ✅ Platzhalter (stark) |

---

## ⏱️ GESAMT ZEIT

| Schritt | Zeit |
|---------|------|
| Domain eintragen | 1 Min |
| Environment Variables | 2 Min |
| Domains konfigurieren | 3 Min |
| DNS Setup | 2 Min |
| DNS Propagation | 5-10 Min |
| Deployment | 10 Min |
| Testing | 5 Min |
| **TOTAL** | **~30 Min** |

---

## 🎯 QUICK COMMANDS

### VPS Commands:

```bash
# SSH verbinden:
ssh root@VPS_IP

# Coolify installieren:
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Logs checken:
docker logs finflow-api --tail 50
docker logs finflow-web --tail 50
docker logs finflow-postgres --tail 50

# Services status:
docker ps

# Restart service:
docker restart finflow-api
```

### DNS Check:

```bash
# Check DNS:
nslookup finflow.DEINE-DOMAIN
nslookup api.DEINE-DOMAIN

# Ping test:
ping finflow.DEINE-DOMAIN
```

### Health Check:

```bash
# Terminal:
curl https://api.DEINE-DOMAIN/health

# Browser:
https://api.DEINE-DOMAIN/health
```

---

## 🚨 QUICK FIXES

### 502 Bad Gateway:

```bash
docker ps  # Check if running
docker logs finflow-api  # Check errors
docker restart finflow-api  # Restart
```

### SSL Certificate Error:

```bash
Coolify → Domains → Regenerate SSL Certificate
Wait 2-3 minutes
```

### DNS not resolving:

```bash
# Wait 10 more minutes
# Or check DNS settings at domain provider
```

---

## 📱 URLS NACH DEPLOYMENT

```
Frontend:  https://finflow.DEINE-DOMAIN
Backend:   https://api.DEINE-DOMAIN
Health:    https://api.DEINE-DOMAIN/health
Coolify:   http://VPS_IP:8000
```

---

## 🔑 API KEYS (Optional - später)

### Alpaca (Stock Trading):

```bash
https://app.alpaca.markets/paper/dashboard/overview
→ Generate Paper Trading Keys
→ Coolify → Environment Variables → Edit ALPACA_API_KEY/SECRET
→ Redeploy
```

### Binance (Crypto Portfolio):

```bash
https://www.binance.com/en/my/settings/api-management
→ Create API Key (Read-Only + IP Whitelist!)
→ Coolify → Environment Variables → Edit BINANCE_API_KEY/SECRET
→ Redeploy
```

---

## ✅ CHECKLIST

### Vor Deployment:
- [ ] `DOMAIN_NAME` in `.env.production` geändert
- [ ] VPS bestellt (Hetzner CPX31 empfohlen)
- [ ] Coolify installiert
- [ ] Domain registriert

### Während Deployment:
- [ ] Environment Variables hochgeladen
- [ ] Domains konfiguriert (Frontend + Backend)
- [ ] DNS A Records gesetzt
- [ ] SSL aktiviert (automatisch)
- [ ] Deploy Button geklickt

### Nach Deployment:
- [ ] Health Check erfolgreich
- [ ] Frontend lädt
- [ ] Registrierung funktioniert
- [ ] Login funktioniert
- [ ] Transaktion erstellen funktioniert
- [ ] Budgets werden korrekt angezeigt

### Optional (später):
- [ ] Alpaca API Keys eingetragen
- [ ] Binance API Keys eingetragen (mit IP Whitelist!)
- [ ] Monitoring eingerichtet (UptimeRobot)
- [ ] Backup Cronjob erstellt

---

## 🎉 ERFOLG!

```
✅ Nur 1 Zeile geändert
✅ ~30 Minuten bis Production
✅ Alle Secrets stark
✅ SSL automatisch
✅ App läuft!
```

**Du bist ein Deployment-Profi! 🚀**
