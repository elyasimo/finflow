# FinFlow Mobile UX/UI Design Documentation

## Design Philosophy

**Ziel**: Ein ruhigeres, eleganteres Dashboard mit mehr Weißraum, größerer Typografie für Kerndaten und sanften Animationen. Reduzierte Informationsdichte bei maximaler Übersichtlichkeit.

---

## 1. Dashboard — Langsamer, Schöner

### Design Rationale
Das Dashboard wurde komplett überarbeitet, um einen ruhigeren, fokussierten Eindruck zu vermitteln. Inspiriert von erfolgreichen Finance-Apps wie Money, N26 und Revolut, setzt das neue Design auf:
- **Großzügiger Weißraum** (padding-x: 24px, padding-y: 32px)
- **Hierarchische Typografie** (Balance: 5xl extralight, Labels: xs uppercase tracking-widest)
- **Subtile Animationen** (fade-in, scale auf Tap)

### Komponenten

#### A) Balance Display
```tsx
<h2 className="text-5xl font-extralight text-gray-900 tracking-tight">
  {formatCurrency(totalBalance)}
</h2>
```
- Font: extralight (100) für elegantes Erscheinungsbild
- Größe: 5xl (3rem) für klare Lesbarkeit
- Letter-spacing: tight für kompakte Darstellung

#### B) Income/Expense Pills
```tsx
<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50">
  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
  <span className="text-sm font-medium text-emerald-600">+{amount}</span>
</div>
```

#### C) Savings Rate Ring
- SVG-basierter Progress Ring (96px × 96px)
- Gradient von Emerald zu Blue
- Animation: 1s duration für sanftes Einblenden

### Interaktions-States
| Element | Default | Tap/Active | Hover (Desktop) |
|---------|---------|------------|-----------------|
| Account Card | scale(1) | scale(0.98) | - |
| Quick Action | opacity(1) | opacity(0.9), scale(0.98) | shadow-md |
| Transaction Row | bg-transparent | bg-gray-50 | bg-gray-50/50 |

---

## 2. Transaction Card Komponente

### Design Rationale
Jede Transaktion wird als eigenständige Karte dargestellt, nicht als Teil einer Sammelliste. Dies verbessert:
- Visuelle Scanbarkeit
- Touch-Target-Größe (min 48px)
- Swipe-Interaktionen

### Datenfelder
```typescript
interface TransactionCard {
  id: string              // Unique identifier
  description: string     // Transaction description
  amount: number          // Amount in cents
  type: 'income' | 'expense'
  category?: string       // Category name
  transactionDate: string // ISO date string
  currency: string        // Currency code (EUR, CHF, etc.)
  note?: string           // Optional note
  tag?: string            // Optional tag/label
  merchant?: string       // Merchant/Empfänger name
}
```

### Interaktions-States
- **Tap** → Navigation zum Detailscreen
- **Swipe Left (>60px)** → Reveal Action Buttons (Flag, Delete)
- **Long Press** → Context Menu (optional)

### Layout
```
┌────────────────────────────────────────────────┐
│ [Icon]  Description          +€125,00          │
│         Nov 27, 2025         [Category Tag]    │
│         #tag · Note...                   [>]   │
└────────────────────────────────────────────────┘
```

---

## 3. Transactions Page — Monatsgruppierung

### Design Rationale
Transaktionen werden nach Monaten gruppiert mit einem Header, der das Monats-Gesamtresultat zeigt. Dies gibt sofortige Übersicht über monatliche Bilanz.

### Month Header Komponente
```typescript
interface MonthHeader {
  month: string           // "November"
  year: number            // 2025
  totalAmount: number     // Net amount (income - expenses)
  currency: string
  transactionCount: number
}
```

### Darstellung
```
November 2025                              −€1.234,00
42 Transaktionen
─────────────────────────────────────────────────────
[Transaction Cards...]
```

### Quick Filters
- **Alle** | **7 Tage** | **30 Tage** | **Einnahmen** | **Ausgaben**
- Horizontal scrollbar Pills
- Active State: Dark background, white text

### Empty State
```tsx
<EmptyState
  icon={<Sparkles />}
  title="Keine Transaktionen"
  description="Beginnen Sie mit dem Tracking..."
  action={<Button>Erste Transaktion hinzufügen</Button>}
/>
```

---

## 4. Budgets als Wallets

### Design Rationale
Budgets werden visuell wie Wallet-Karten dargestellt, um Konsistenz mit der Kontenansicht zu schaffen und "Envelope Budgeting" zu visualisieren.

### Budget Wallet Card
```typescript
interface BudgetWalletCard {
  id: string
  name: string
  amount: number          // Budget limit
  spent: number           // Current spending
  currency: string
  category?: string
  startDate?: string
  endDate?: string
  isPinned?: boolean      // Show in Wallet overview
}
```

### Computed Fields
- `progress`: `(spent / amount) * 100`
- `remaining`: `amount - spent`
- `isOverBudget`: `progress >= 100`
- `isWarning`: `progress >= 80 && progress < 100`

### Card Variant (288px × auto)
```
┌────────────────────────────────────────┐
│ [Icon]  Budget Name          [⋮]      │
│                                        │
│         ┌──────────┐                   │
│         │   72%    │  ← Progress Ring  │
│         │verwendet │                   │
│         └──────────┘                   │
│                                        │
│      €280,00 von €400,00 übrig         │
│                                        │
│    [ ↑ Aufstocken ]                    │
└────────────────────────────────────────┘
```

### List Variant
```
┌──────────────────────────────────────────────────┐
│ [Icon]  Budget Name               72%            │
│         €280,00 übrig                            │
│ ████████████████████░░░░░░                       │
│ €120 von €400          bis 30. Nov               │
└──────────────────────────────────────────────────┘
```

### Aktionen
- **Aufstocken**: Budget-Limit erhöhen
- **Bearbeiten**: Name, Limit, Kategorie ändern
- **Anheften**: In Wallet-Übersicht anzeigen
- **Löschen**: Budget entfernen

---

## 5. Kategorien — Modern & Reduziert

### Design Rationale
Minimal gehaltenes Kategorien-Set für schnelle Zuordnung. Keine verschachtelten Kategorien, stattdessen Tags für Feingliedrigkeit.

### Default-Kategorien
| ID | Name | Icon | Farbe |
|----|------|------|-------|
| food | Essen & Lebensmittel | Utensils | Orange |
| housing | Miete & Wohnen | Home | Indigo |
| transport | Transport | Car | Blue |
| subscriptions | Abonnements | Smartphone | Violet |
| health | Gesundheit | Heart | Rose |
| income | Gehalt/Einnahmen | Banknote | Emerald |
| other | Sonstiges | MoreHorizontal | Gray |

### Custom Labels/Tags
Nutzer können eigene Tags erstellen, die kategorieunabhängig sind:
```typescript
interface Tag {
  id: string
  name: string           // z.B. "Urlaub 2025", "Geschenke"
  color?: string         // Optional custom color
}
```

### Kategorie Card
```
┌──────────────────────────────────────────────────┐
│ [🍽️]  Essen & Lebensmittel          [⋯]         │
│       42 Transaktionen                           │
└──────────────────────────────────────────────────┘
```

---

## 6. Registration + Onboarding Flow

### Flow-Schritte
1. **Contact** → Email/Telefon eingeben
2. **Verification** → 6-stelliger OTP-Code
3. **Verified** → Erfolgsanimation (2s)
4. **Account Setup** → Erstes Konto anlegen
5. **Complete** → Weiterleitung zum Dashboard

### Formular: Account Setup
```typescript
interface AccountSetupForm {
  bankName: string        // Autocomplete mit populären Banken
  accountType: 'checking' | 'savings' | 'credit'
  displayName: string     // z.B. "Hauptkonto"
  iban?: string           // Optional, für Referenz
}
```

### Bank Autocomplete
```typescript
const popularBanks = [
  'UBS', 'Credit Suisse', 'Raiffeisen', 'PostFinance',
  'Zürcher Kantonalbank', 'Migros Bank', 'Bank Cler',
  'Swissquote', 'Revolut', 'N26', 'Andere'
]
```

### Sicherheitshinweise
- "Ihre Daten werden sicher verschlüsselt" mit Shield-Icon
- "Bankdaten werden sicher verschlüsselt" mit Lock-Icon
- SSL/TLS Badge (optional)

---

## JSON Schema für Backend

### Transaction Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "accountId": { "type": "string", "format": "uuid" },
    "type": { "enum": ["income", "expense", "transfer"] },
    "amount": { "type": "integer", "description": "Amount in cents" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "description": { "type": "string", "maxLength": 255 },
    "merchant": { "type": "string", "maxLength": 100 },
    "categoryId": { "type": "string", "format": "uuid" },
    "note": { "type": "string", "maxLength": 500 },
    "tags": { "type": "array", "items": { "type": "string" } },
    "transactionDate": { "type": "string", "format": "date-time" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "userId", "accountId", "type", "amount", "currency", "transactionDate"]
}
```

### Account Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "maxLength": 100 },
    "type": { "enum": ["checking", "savings", "credit", "investment", "cash"] },
    "bankName": { "type": "string", "maxLength": 100 },
    "balance": { "type": "integer", "description": "Balance in cents" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "iban": { "type": "string", "pattern": "^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$" },
    "isPinned": { "type": "boolean", "default": false },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "userId", "name", "type", "currency"]
}
```

### Budget Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "maxLength": 100 },
    "amount": { "type": "integer", "description": "Budget limit in cents" },
    "spent": { "type": "integer", "description": "Current spending in cents" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "categoryId": { "type": "string", "format": "uuid" },
    "startDate": { "type": "string", "format": "date" },
    "endDate": { "type": "string", "format": "date" },
    "isPinned": { "type": "boolean", "default": false },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "userId", "name", "amount", "currency", "startDate", "endDate"]
}
```

### Category Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "maxLength": 50 },
    "icon": { "type": "string", "maxLength": 50 },
    "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
    "isDefault": { "type": "boolean", "default": false },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "name"]
}
```

---

## Responsive Hinweise

### iOS Specifics
- Safe Area Insets für Notch/Dynamic Island
- `env(safe-area-inset-top)` für Header
- `env(safe-area-inset-bottom)` für Bottom Nav
- Haptic Feedback bei Aktionen (optional)
- 44pt minimum touch target

### Android Specifics
- Material Design Ripple-Effekte
- System Navigation Bar spacing
- Edge-to-edge Design Support
- Back Gesture Handling

### Shared
- Min touch target: 44×44px (iOS) / 48×48dp (Android)
- Swipe threshold: 60px für Aktions-Reveal
- Animation duration: 200-300ms für Micro-interactions
- Font scaling: Support für Dynamic Type / Accessibility

---

## Komponenten-Export

Die folgenden neuen Komponenten wurden erstellt:

```
components/finflow/ui/
├── transaction-card.tsx      # Einzelne Transaktionskarte mit Swipe
├── wallet-card.tsx           # Konto-Karte (Carousel-Style)
├── budget-wallet-card.tsx    # Budget als Wallet-Karte
└── month-header.tsx          # Monatsgruppierungs-Header

components/finflow/
├── mobile-dashboard-new.tsx      # Neues Dashboard
├── mobile-transactions-new.tsx   # Neue Transaktionen-Seite
├── mobile-budgets-new.tsx        # Neue Budgets-Seite
├── mobile-categories-new.tsx     # Neue Kategorien-Seite
└── mobile-onboarding.tsx         # Registration + Onboarding Flow
```

---

## Migration Guide

Um die neuen Komponenten zu nutzen, ersetzen Sie die Imports:

```tsx
// Alt
import MobileDashboard from '@/components/finflow/mobile-dashboard'

// Neu
import MobileDashboard from '@/components/finflow/mobile-dashboard-new'
```

Die neuen Komponenten sind API-kompatibel mit den bestehenden, benötigen jedoch zusätzliche optionale Props für erweiterte Features (isPinned, tags, merchant etc.).
