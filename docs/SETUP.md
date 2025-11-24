# 🚀 Setup Guide

Complete guide to get Finflow running locally and in production.

---

## Quick Start (Docker Compose)

### 1. Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Git**
- **Node.js 18+** (for local backend development)
- **Flutter 3.24+** (for mobile/web development)

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/finflow.git
cd finflow
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
POSTGRES_PASSWORD=strong_password_here
```

**Generate secure JWT secret:**
```bash
openssl rand -base64 32
```

### 4. Start Services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **API** on port 8080
- **Web** on port 3000

**With pgAdmin:**
```bash
docker-compose --profile tools up -d
```
Access pgAdmin at http://localhost:5050

### 5. Run Migrations

```bash
cd backend
npm install
npm run migrate
```

### 6. (Optional) Seed Demo Data

```bash
npm run seed
```

Creates:
- Demo user: `demo@finflow.app` / `password123`
- Sample accounts and transactions

### 7. Access the App

- **Web App:** http://localhost:3000
- **API:** http://localhost:8080/health
- **pgAdmin:** http://localhost:5050 (admin@finflow.app / admin)

---

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm install

# Start PostgreSQL (via Homebrew, apt, etc.)
brew services start postgresql@16

# Create database
createdb finflow

# Set DATABASE_URL
export DATABASE_URL=postgresql://yourusername@localhost:5432/finflow

# Run migrations
npm run migrate

# Start dev server
npm run dev
```

API runs on http://localhost:8080 with hot-reload.

### Frontend

```bash
cd app
flutter pub get

# Web
flutter run -d chrome

# Android (requires emulator or device)
flutter run -d android

# iOS (macOS only, requires Xcode)
flutter run -d ios
```

---

## Production Deployment

### Option 1: Render (API) + Netlify (Web)

#### Backend on Render

1. Push code to GitHub
2. Create new **Web Service** on Render
3. Connect repository, set:
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm run migrate && npm start`
   - **Environment Variables:**
     ```
     DATABASE_URL=<Render PostgreSQL URL>
     JWT_SECRET=<strong secret>
     NODE_ENV=production
     CORS_ORIGIN=https://yourapp.netlify.app
     ```
4. Deploy

#### Frontend on Netlify

```bash
cd app
flutter build web --release

# Deploy
netlify deploy --prod --dir=build/web
```

Or connect GitHub repo to Netlify:
- **Build Command:** `cd app && flutter build web --release`
- **Publish Directory:** `app/build/web`

---

### Option 2: Docker (Self-Hosted)

#### Build Production Images

```bash
# Backend
docker build -f infra/api/Dockerfile -t finflow-api:latest ./backend

# Web
docker build -f infra/web/Dockerfile -t finflow-web:latest ./app
```

#### Deploy with Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    # ... (same as dev)

  api:
    image: finflow-api:latest
    environment:
      DATABASE_URL: postgresql://...
      NODE_ENV: production
      # ...

  web:
    image: finflow-web:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl  # SSL certificates
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### SSL with Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d finflow.app -d www.finflow.app

# Auto-renew
certbot renew --dry-run
```

---

### Option 3: Kubernetes (Advanced)

See `docs/DEPLOY_K8S.md` (TODO).

---

## Mobile App Deployment

### Android

```bash
cd app

# Build release APK
flutter build apk --release

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

**Upload to Google Play Console**

### iOS

```bash
cd app

# Build IPA
flutter build ipa --release
```

**Upload to App Store Connect** via Xcode or Transporter.

---

## Database Management

### Backup PostgreSQL

```bash
# Local
pg_dump finflow > backup_$(date +%Y%m%d).sql

# Restore
psql finflow < backup_20241117.sql

# Render (example)
pg_dump $DATABASE_URL > backup.sql
```

### Migrations

```bash
cd backend

# Generate migration
npm run migrate:generate

# Apply migrations
npm run migrate

# Rollback last migration
npm run migrate:drop
```

---

## Environment Variables Reference

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `NODE_ENV` | `development` | `development` or `production` |
| `API_PORT` | `8080` | Server port |
| `JWT_SECRET` | - | **REQUIRED** JWT signing key (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry (e.g., `1h`, `30d`) |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds (10-14) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origins (comma-separated) |
| `ALPHA_VANTAGE_KEY` | `demo` | Alpha Vantage API key |

### Frontend

Flutter apps use compile-time constants. Set API URL in `lib/api/api_client.dart`:

```dart
static const String baseUrl = 'https://api.finflow.app'; // Production
```

For environment-specific builds:
```bash
flutter build web --dart-define=API_URL=https://api.finflow.app
```

---

## Troubleshooting

### Issue: "Connection refused" from API

**Solution:**
1. Check PostgreSQL is running: `docker ps`
2. Check logs: `docker logs finflow-api`
3. Verify `DATABASE_URL` in `.env`

### Issue: Flutter web build fails

**Solution:**
```bash
flutter clean
flutter pub get
flutter build web --release
```

### Issue: JWT errors in frontend

**Solution:**
1. Clear app data (secure storage)
2. Re-login
3. Check token expiry in backend logs

### Issue: Migrations not applying

**Solution:**
```bash
cd backend
npm run migrate:drop
npm run migrate:generate
npm run migrate
```

---

## Monitoring (Production)

### Logs

**Backend (Render):**
```bash
render logs -s finflow-api
```

**Docker:**
```bash
docker logs -f finflow-api
```

### Metrics

Recommended tools:
- **Sentry** (error tracking)
- **Datadog** (APM)
- **Prometheus + Grafana** (self-hosted)

### Alerts

Set up alerts for:
- 5xx error rate > 1%
- Response time > 2s
- Database connection failures
- Disk space < 10%

---

## Updating

### Backend

```bash
cd backend
npm update
npm audit fix
npm run test
```

### Frontend

```bash
cd app
flutter pub upgrade
flutter test
```

### Database Schema

```bash
cd backend
npm run migrate:generate
npm run migrate
```

---

## Support

- **Documentation:** https://finflow.app/docs
- **GitHub Issues:** https://github.com/yourusername/finflow/issues
- **Discord:** https://discord.gg/finflow
- **Email:** support@finflow.app

---

**Last Updated:** 2024-11
