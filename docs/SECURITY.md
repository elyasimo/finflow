# 🔒 Security Guide

## Overview

Finflow implements multiple security layers to protect user data:

1. **Authentication & Authorization**
2. **Data Encryption** (optional E2E)
3. **Network Security**
4. **Database Security**
5. **Input Validation**

---

## 1. Authentication & Authorization

### JWT-Based Authentication

- **Algorithm:** HS256 (HMAC with SHA-256)
- **Expiry:** 7 days (configurable via `JWT_EXPIRES_IN`)
- **Storage:** Client-side in `flutter_secure_storage` (encrypted keychain/keystore)

**Token Flow:**
```
1. User registers/logs in → Server issues JWT
2. Client stores token securely
3. Subsequent requests include `Authorization: Bearer <token>`
4. Server validates token on each request
```

### Password Security

- **Hashing:** bcrypt with 12 rounds (configurable via `BCRYPT_ROUNDS`)
- **Requirements:** Minimum 8 characters (enforced client + server-side)
- **Storage:** Only hashed passwords stored in database

**Recommendations for Production:**
- Increase bcrypt rounds to 14+ for enhanced security
- Implement password complexity rules (uppercase, lowercase, numbers, symbols)
- Add password reset flow with email verification
- Consider 2FA (TOTP or SMS)

---

## 2. Data Encryption

### Transport Layer (TLS/HTTPS)

- All communication must use HTTPS in production
- Docker/nginx configured with TLS certificates (Let's Encrypt recommended)

### Optional End-to-End (E2E) Encryption

**When Enabled:**
- Sensitive fields (`notes`, `description`, `attachmentRefs`) encrypted client-side
- Server only stores encrypted ciphertext
- Keys derived from user password (PBKDF2 with 100,000 iterations)
- Algorithm: AES-256-GCM or XChaCha20-Poly1305

**Limitations:**
- Server-side search/filtering on encrypted fields not possible
- Password reset = data loss (unless key escrow implemented)

**Implementation Status:** Prepared but disabled by default (opt-in during onboarding)

---

## 3. User Isolation (RLS-Equivalent)

### Application-Level Row-Level Security

All database queries **strictly filter by `user_id`**:

```typescript
// Example from AccountsController
const accounts = await db.query.accounts.findMany({
  where: eq(accounts.userId, req.userId!), // CRITICAL
});
```

**Protection Against:**
- Unauthorized access to other users' data
- IDOR (Insecure Direct Object Reference) vulnerabilities

**Testing:**
- Integration tests verify user isolation
- Penetration testing recommended before production

---

## 4. Network Security

### Implemented Protections

1. **Helmet.js** - Security headers (XSS, Clickjacking, MIME sniffing protection)
2. **CORS** - Strict origin validation (`CORS_ORIGIN` env variable)
3. **Rate Limiting** - 100 requests per 15 minutes on `/auth` endpoints
4. **Input Validation** - Zod schemas for all request bodies

### OWASP Top 10 Mitigations

| Threat | Mitigation |
|--------|-----------|
| A01: Broken Access Control | User ID filtering, JWT verification |
| A02: Cryptographic Failures | bcrypt, TLS, optional E2E encryption |
| A03: Injection | Parameterized queries (Drizzle ORM) |
| A04: Insecure Design | Principle of least privilege, secure defaults |
| A05: Security Misconfiguration | Environment variables, Helmet.js |
| A06: Vulnerable Components | Dependabot, regular updates |
| A07: Auth Failures | JWT, bcrypt, rate limiting |
| A08: Software/Data Integrity | Code signing, immutable Docker images |
| A09: Logging Failures | Winston logger (errors logged, PII excluded) |
| A10: SSRF | No user-controlled URLs in backend requests |

---

## 5. Database Security

### PostgreSQL Hardening

**Recommended Production Settings:**

```sql
-- Create read-only user for backups
CREATE ROLE finflow_readonly WITH LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE finflow TO finflow_readonly;
GRANT USAGE ON SCHEMA public TO finflow_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finflow_readonly;

-- Enforce SSL connections
ALTER SYSTEM SET ssl = on;

-- Limit connections
ALTER SYSTEM SET max_connections = 100;
```

### Backup Strategy

1. **Automated Daily Backups:** Use `pg_dump` with encryption
2. **Point-in-Time Recovery:** Enable WAL archiving
3. **Geo-Redundant Storage:** Store backups in different regions

---

## 6. Secrets Management

### Environment Variables

**NEVER commit `.env` files!**

```bash
# .env.example provided; users must create .env locally
cp .env.example .env
# Edit .env with production secrets
```

**Production Secrets:**
- Use secret managers (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Rotate JWT secrets periodically
- Use strong, random values (32+ characters)

**Generate Secure JWT Secret:**
```bash
openssl rand -base64 32
```

---

## 7. Penetration Testing Checklist

Before production deployment:

- [ ] SQL Injection testing (automated + manual)
- [ ] XSS testing (reflected, stored, DOM-based)
- [ ] CSRF testing
- [ ] Authentication bypass attempts
- [ ] Authorization testing (IDOR, privilege escalation)
- [ ] Rate limiting validation
- [ ] Sensitive data exposure (logs, error messages)
- [ ] File upload vulnerabilities (if attachments enabled)

**Tools:**
- OWASP ZAP
- Burp Suite
- sqlmap
- Custom scripts for business logic testing

---

## 8. Incident Response Plan

**In Case of Security Breach:**

1. **Immediate Actions:**
   - Revoke all active JWT tokens (rotate `JWT_SECRET`)
   - Force password reset for affected users
   - Take affected systems offline if necessary

2. **Investigation:**
   - Analyze logs (`winston` errors, database audit logs)
   - Identify attack vector and compromised data
   - Document timeline and impact

3. **Remediation:**
   - Patch vulnerabilities
   - Deploy hotfixes
   - Notify affected users (GDPR compliance)

4. **Post-Mortem:**
   - Root cause analysis
   - Improve security controls
   - Update documentation

---

## 9. Compliance (GDPR)

### Data Minimization

- Only collect necessary data (email, financial transactions)
- No telemetry/analytics by default

### User Rights

1. **Right to Access:** `/auth/me`, export endpoints
2. **Right to Erasure:** DELETE `/auth/account` (soft delete + anonymization)
3. **Data Portability:** JSON/CSV export functionality

### Privacy Policy

⚠️ **TODO:** Draft privacy policy before public release

---

## 10. Security Contacts

**Report Vulnerabilities:**
- Email: security@finflow.app
- PGP Key: [Link to public key]
- Bug Bounty: [If applicable]

**Disclosure Policy:**
- 90-day disclosure timeline
- Acknowledgment within 48 hours
- Fix deployed before public disclosure

---

## Additional Resources

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Flutter Security Best Practices](https://docs.flutter.dev/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/runtime-config-connection.html#RUNTIME-CONFIG-CONNECTION-SECURITY)

---

**Last Updated:** 2024-11
**Maintained By:** Finflow Security Team
