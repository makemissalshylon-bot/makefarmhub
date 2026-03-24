# MAKEFARMHUB Security Testing Checklist

## Authentication & Authorization

### Input Validation
- [ ] SQL injection on login fields
- [ ] XSS in email/name fields
- [ ] Path traversal in file uploads
- [ ] Mass assignment on user profile update

### Authentication Flows
- [ ] Brute-force protection on OTP (max 5 attempts)
- [ ] OTP expiry enforcement (10-minute window)
- [ ] JWT token expiry and refresh handling
- [ ] 2FA bypass attempts (skipping verification step)
- [ ] Session fixation after login

### Authorization
- [ ] Accessing other users' wishlists by ID manipulation
- [ ] Accessing other users' orders
- [ ] Editing listings that don't belong to current user
- [ ] Admin endpoints accessible without admin role
- [ ] Direct Supabase RPC calls with non-admin JWT

---

## Payment Security

### Mobile Money
- [ ] Double-submit payment (replay attack)
- [ ] Amount tampering in POST body
- [ ] Invalid phone number formats accepted
- [ ] Negative amount payloads
- [ ] Payment for non-existent orders
- [ ] CSRF on payment initiation

### Webhook Security
- [ ] Webhook signature verification (HMAC-SHA256)
- [ ] Unsigned webhook requests rejected (401)
- [ ] Replayed webhook events handled idempotently

---

## API Security

### Rate Limiting
- [ ] `/api/mobile-money-initiate` limited to 10 req/min per user
- [ ] `/api/send-sms-notification` limited to 5 req/min per user
- [ ] Auth endpoints rate-limited (brute force protection)
- [ ] Rate limit headers present in responses

### Headers
- [ ] Content-Security-Policy set
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present on production
- [ ] No server version disclosure

### CORS
- [ ] CORS restricted to known origins in production
- [ ] Preflight requests handled correctly
- [ ] Credentials not sent to cross-origin requests

---

## Data Security

### Sensitive Data
- [ ] Passwords never logged
- [ ] Phone numbers masked in logs
- [ ] API keys not exposed in frontend bundle
- [ ] Supabase service role key not exposed client-side
- [ ] `.env` files excluded from version control

### Database
- [ ] RLS (Row Level Security) enforced on all tables
- [ ] Service role only used in trusted server environments
- [ ] Anonymous users can only read public listings
- [ ] Wishlist data only readable by owner

---

## Frontend Security

### Client-Side
- [ ] No sensitive data in localStorage (no tokens, no keys)
- [ ] Console.log statements removed in production build
- [ ] Source maps not served in production
- [ ] Dependency audit: `npm audit`

---

## Running Security Tests

### OWASP ZAP (Automated)
```bash
# Install ZAP and run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:5173 \
  -r tests/security/results/zap-report.html
```

### npm Dependency Audit
```bash
npm audit
npm audit --audit-level=high
```

### Check for Secrets in Code
```bash
# Using trufflehog
npx trufflehog filesystem . --only-verified

# Using git-secrets (if installed)
git secrets --scan
```

### CSP Evaluation
Visit https://csp-evaluator.withgoogle.com and paste the Content-Security-Policy header value.

### SSL/TLS Check (Production)
```bash
# Check SSL configuration
nmap --script ssl-enum-ciphers -p 443 makefarmhub.netlify.app

# Or use online tool
# https://www.ssllabs.com/ssltest/analyze.html?d=makefarmhub.netlify.app
```

---

## Results

| Test Category | Status | Notes |
|--------------|--------|-------|
| Authentication | Pending | |
| Payment Security | Pending | |
| Rate Limiting | Pending | |
| Security Headers | Pending | |
| CORS | Pending | |
| Data Exposure | Pending | |
| Dependency Audit | Pending | |
