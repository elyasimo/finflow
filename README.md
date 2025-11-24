# 💰 Finflow - Modern Finance Management

> **Online-first** Multi-Platform Finance Manager built with Flutter, Express, and PostgreSQL.

[![CI/CD](https://github.com/yourusername/finflow/workflows/Lint%20and%20Test/badge.svg)](https://github.com/yourusername/finflow/actions)

## ✨ Features

- 📊 **Real-time Dashboard** with interactive charts (Cashflow, Net Worth, Expenses)
- 💳 **Multi-Account Management** (Cash, Bank, Credit Card, Investments, Crypto)
- 🌍 **Multi-Currency Support** with automatic FX conversion
- 📈 **Investment Portfolio Tracking** with live price updates
- 🎯 **Budget Planning** with rollover and alerts
- 📥 **CSV/Excel Import** with auto-categorization rules
- 🔒 **Optional E2E Encryption** for sensitive fields
- 🌙 **Dark Mode** support
- 🌐 **i18n** (DE/EN)

## 🏗️ Architecture

**Online-First:** No local SQLite database. All data stored in PostgreSQL, accessed via REST API.

- **Client:** Flutter (Web/Android/iOS) with Riverpod state management
- **Backend:** Express (TypeScript) + Drizzle ORM
- **Database:** PostgreSQL 16
- **Deployment:** Docker Compose (local), Render (API), Netlify (Web)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for backend development)
- Flutter 3.24+ (for mobile/web development)

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/finflow.git
cd finflow
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=postgresql://finflow:secret@localhost:5432/finflow

# API
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
API_PORT=8080

# Optional: Alpha Vantage API Key (fallback price provider)
ALPHA_VANTAGE_KEY=your_key_here
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **API** on `http://localhost:8080`
- **Web** on `http://localhost:3000`
- **pgAdmin** on `http://localhost:5050` (optional)

### 3. Run Migrations

```bash
cd backend
npm install
npm run migrate
npm run seed  # Optional: Load demo data
```

### 4. Access the App

- **Web:** http://localhost:3000
- **API Docs:** http://localhost:8080/health
- **pgAdmin:** http://localhost:5050 (admin@finflow.app / admin)

## 📱 Development

### Backend (API)

```bash
cd backend
npm install
npm run dev          # Start dev server with hot-reload
npm run test         # Run tests
npm run lint         # Run ESLint
npm run migrate      # Run migrations
npm run migrate:drop # Rollback last migration
```

### Frontend (Flutter)

```bash
cd app
flutter pub get
flutter run -d chrome           # Web
flutter run -d android          # Android
flutter run -d ios              # iOS
flutter test                    # Run tests
flutter analyze                 # Run linter
flutter build web --release     # Production web build
```

## 🗄️ Database Schema

Key tables:
- `users` - User accounts with auth
- `accounts` - Financial accounts (Bank, Cash, Investment, etc.)
- `transactions` - All financial transactions with optional E2E encryption
- `categories` - Hierarchical categories
- `budgets` - Monthly/yearly budgets per category
- `holdings` - Investment positions
- `prices` - Cached price data from external APIs

See [docs/SCHEMA.md](docs/SCHEMA.md) for full schema.

## 🔐 Security

- **JWT Authentication** with HTTP-only cookies (optional)
- **Password Hashing** with bcrypt (12 rounds)
- **User Isolation:** All queries filtered by `user_id`
- **Optional E2E Encryption** for `notes`, `description`, `attachments`
- **Rate Limiting** on auth endpoints
- **Helmet.js** security headers
- **Input Validation** with Zod schemas

See [docs/SECURITY.md](docs/SECURITY.md) for details.

## 📊 API Endpoints

### Auth
- `POST /auth/register` - Create account
- `POST /auth/login` - Login (returns JWT)
- `GET /auth/me` - Get current user

### Accounts
- `GET /accounts` - List all accounts
- `POST /accounts` - Create account
- `PUT /accounts/:id` - Update account
- `DELETE /accounts/:id` - Archive account

### Transactions
- `GET /transactions` - List with filters (date, category, account)
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Soft delete

### Dashboard
- `GET /dashboard/summary` - Net worth, cashflow, expenses
- `GET /dashboard/charts` - Chart data (timeseries, categories)

See [docs/API.md](docs/API.md) for full API reference.

## 🧪 Testing

```bash
# Backend
cd backend
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report

# Frontend
cd app
flutter test                      # All tests
flutter test test/unit           # Unit tests
flutter test test/widget         # Widget tests
flutter test --coverage          # Coverage report
```

## 🚢 Deployment

### Production Backend (Render)

1. Push to GitHub
2. Connect Render to repo
3. Add environment variables
4. Deploy automatically on push to `main`

See [docs/DEPLOY.md](docs/DEPLOY.md)

### Production Web (Netlify)

```bash
cd app
flutter build web --release
# Upload build/web/ to Netlify or use CLI
netlify deploy --prod --dir=build/web
```

### Mobile Apps

```bash
# Android
flutter build appbundle --release

# iOS
flutter build ipa --release
```

## 📚 Documentation

- [Architecture Decision Records](docs/ADR.md)
- [Database Schema](docs/SCHEMA.md)
- [API Reference](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOY.md)
- [Contributing](docs/CONTRIBUTING.md)

## 🛠️ Tech Stack

**Frontend:**
- Flutter 3.24+
- Riverpod (State Management)
- go_router (Navigation)
- dio (HTTP Client)
- fl_chart (Charts)
- flutter_secure_storage (Secure Storage)

**Backend:**
- Node.js 18+ with TypeScript
- Express.js
- Drizzle ORM
- Zod (Validation)
- JWT + bcrypt (Auth)

**Database:**
- PostgreSQL 16

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Render (API hosting)
- Netlify (Web hosting)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 🐛 Issues

Report bugs at [GitHub Issues](https://github.com/yourusername/finflow/issues)

---

**Built with ❤️ using Flutter, Express, and PostgreSQL**
