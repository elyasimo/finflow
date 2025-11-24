## API Reference

**Base URL:** `http://localhost:8080` (development)
**Production:** `https://api.finflow.app`

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` header.

---

### Authentication

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-11-17T10:00:00Z"
  },
  "accessToken": "eyJhbGc..."
}
```

---

#### POST /auth/login
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-11-17T10:00:00Z"
  },
  "accessToken": "eyJhbGc..."
}
```

---

#### GET /auth/me
Get current user profile (requires authentication).

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2024-11-17T10:00:00Z"
}
```

---

### Accounts

#### GET /accounts
List all user accounts.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Main Checking",
    "type": "bank",
    "currency": "EUR",
    "openingBalanceCents": 100000,
    "currentBalanceCents": 150000,
    "color": "#667eea",
    "archived": false,
    "createdAt": "2024-11-17T10:00:00Z",
    "updatedAt": "2024-11-17T10:00:00Z"
  }
]
```

---

#### POST /accounts
Create a new account.

**Request:**
```json
{
  "name": "Savings Account",
  "type": "bank",
  "currency": "EUR",
  "openingBalanceCents": 500000,
  "color": "#43e97b"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Savings Account",
  "type": "bank",
  "currency": "EUR",
  "openingBalanceCents": 500000,
  "currentBalanceCents": 500000,
  "color": "#43e97b",
  "archived": false,
  "createdAt": "2024-11-17T10:00:00Z",
  "updatedAt": "2024-11-17T10:00:00Z"
}
```

**Account Types:**
- `cash`
- `bank`
- `creditCard`
- `investment`
- `crypto`

---

#### PUT /accounts/:id
Update an account.

**Request:**
```json
{
  "name": "Updated Name",
  "color": "#f093fb"
}
```

**Response (200):** Updated account object

---

#### DELETE /accounts/:id
Archive an account (soft delete).

**Response (204):** No content

---

### Transactions

#### GET /transactions
List transactions with optional filters.

**Query Parameters:**
- `accountId` (uuid)
- `categoryId` (uuid)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `limit` (number, default 100)
- `offset` (number, default 0)

**Example:**
```
GET /transactions?accountId=uuid&startDate=2024-01-01T00:00:00Z&limit=50
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "accountId": "uuid",
    "type": "expense",
    "amountCents": 5000,
    "currency": "EUR",
    "fxRate": "1.0",
    "date": "2024-11-17T10:00:00Z",
    "description": "Groceries",
    "notes": "Weekly shopping",
    "attachmentRefs": [],
    "categoryId": "uuid",
    "tags": ["food", "essential"],
    "splitParentId": null,
    "toAccountId": null,
    "createdAt": "2024-11-17T10:00:00Z",
    "updatedAt": "2024-11-17T10:00:00Z",
    "deletedAt": null,
    "category": {
      "id": "uuid",
      "name": "Groceries",
      "icon": "shopping_cart",
      "color": "#43e97b"
    },
    "account": {
      "id": "uuid",
      "name": "Main Checking",
      "type": "bank"
    }
  }
]
```

---

#### POST /transactions
Create a transaction.

**Request (Expense):**
```json
{
  "accountId": "uuid",
  "type": "expense",
  "amountCents": 5000,
  "currency": "EUR",
  "date": "2024-11-17T10:00:00Z",
  "description": "Groceries",
  "categoryId": "uuid",
  "tags": ["food"]
}
```

**Request (Transfer):**
```json
{
  "accountId": "uuid-from",
  "toAccountId": "uuid-to",
  "type": "transfer",
  "amountCents": 10000,
  "currency": "EUR",
  "date": "2024-11-17T10:00:00Z",
  "description": "Transfer to savings"
}
```

**Response (201):** Created transaction object

---

#### PUT /transactions/:id
Update a transaction.

**Request:**
```json
{
  "description": "Updated description",
  "amountCents": 6000
}
```

**Response (200):** Updated transaction object

---

#### DELETE /transactions/:id
Soft delete a transaction.

**Response (204):** No content

---

### Categories

#### GET /categories
List all user categories.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Groceries",
    "parentId": null,
    "icon": "shopping_cart",
    "color": "#43e97b",
    "createdAt": "2024-11-17T10:00:00Z"
  }
]
```

---

#### POST /categories
Create a category.

**Request:**
```json
{
  "name": "Restaurants",
  "parentId": null,
  "icon": "restaurant",
  "color": "#f093fb"
}
```

**Response (201):** Created category object

---

### Dashboard

#### GET /dashboard/summary
Get financial summary.

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response (200):**
```json
{
  "netWorth": 1500000,
  "totalIncome": 300000,
  "totalExpenses": 150000,
  "cashflow": 150000,
  "savingsRate": 0.50,
  "topCategories": [
    {
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "totalCents": 50000
    }
  ]
}
```

---

### Error Responses

All errors follow this format:

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

### Rate Limiting

- **Auth endpoints:** 100 requests per 15 minutes per IP
- **Other endpoints:** No limit (add as needed)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637150400
```

---

### Pagination

Use `limit` and `offset` query parameters:

```
GET /transactions?limit=20&offset=40
```

**Response headers:**
```
X-Total-Count: 150
```

---

### Webhooks (Future)

Planned for v2.0:
- Transaction created/updated/deleted
- Budget exceeded
- Goal achieved

---

**API Version:** v1
**Last Updated:** 2024-11
