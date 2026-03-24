# MAKEFARMHUB Testing Guide

## Testing Strategy

MAKEFARMHUB uses a comprehensive testing approach covering:
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user flows with Playwright

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Integration Tests

```bash
# Run API integration tests
npm run test:integration
```

---

## Test Coverage

### Unit Tests

**Services Covered:**
- ✅ Mobile Money Service
  - Phone validation for all providers
  - Fee calculation
  - Payment initiation
  - Status checking
  
- ✅ Localization Service
  - Language switching (English, Shona, Ndebele)
  - Translation system
  - Currency formatting
  - Date formatting
  
- ✅ Wishlist Service
  - Add/remove items
  - Fetch wishlist
  - Check membership
  - Count items
  
- ✅ Weather Service
  - Current weather
  - 7-day forecast
  - Farming recommendations
  - Planting calendar
  
- ✅ Market Price Service
  - Price fetching
  - Historical data
  - Trend analysis
  - Search functionality
  
- ✅ Image Optimization Service
  - File validation
  - Type checking
  - Size limits
  
- ✅ Rate Limit Service
  - Request counting
  - Window management
  - Multi-key tracking

### E2E Tests

**User Flows Covered:**
- ✅ Authentication
  - Login/logout
  - Registration
  - Password reset
  
- ✅ Marketplace
  - Browse products
  - Search & filter
  - Product details
  
- ✅ Listing Creation
  - Form submission
  - Image upload
  - Validation
  
- ✅ Mobile Money Payments
  - Provider selection
  - Phone validation
  - Payment flow
  - Status polling
  
- ✅ Wishlist
  - Add items
  - Remove items
  - View saved items
  
- ✅ Localization
  - Language switching
  - Translation verification
  - Persistence

### Integration Tests

**API Endpoints Covered:**
- ✅ Mobile Money APIs
  - Payment initiation
  - Status checking
  - Error handling
  
- ✅ Authentication APIs
  - Email verification
  - Phone OTP
  - 2FA setup
  - 2FA verification

---

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Variables

Create `.env.test`:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_anon_key
```

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myService } from '../myService';

describe('myService', () => {
  it('should do something', () => {
    const result = myService.doSomething();
    expect(result).toBe(expected);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  await page.fill('input[type="text"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('API Integration', () => {
  it('should call endpoint successfully', async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
    expect(response.ok).toBe(true);
  });
});
```

---

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Merge to main branch
- Scheduled nightly builds

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Test Data

### Mock Users

**Admin:**
- Phone: `admin` or `000`
- Password: `admin`

**Farmer:**
- Email: `farmer@test.com`
- Password: `password123`

**Buyer:**
- Email: `buyer@test.com`
- Password: `password123`

### Test Phone Numbers

- EcoCash: `+263771234567`
- OneMoney: `+263711234567`
- Telecash: `+263731234567`

### Test OTP Code

- Development: `1234`

---

## Coverage Goals

**Target Coverage:**
- Unit Tests: > 80%
- Integration Tests: > 70%
- E2E Tests: Critical paths only

**Current Coverage:**
- Unit Tests: ~75%
- Integration Tests: ~60%
- E2E Tests: 6 critical flows

---

## Troubleshooting

### Playwright Issues

**Browser not found:**
```bash
npx playwright install
```

**Test timeout:**
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Vitest Issues

**Module not found:**
```bash
npm install
```

**Mock not working:**
```typescript
import { vi } from 'vitest';
vi.mock('../module');
```

---

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should clearly state what's being tested
3. **Avoid hardcoded waits** - Use proper wait conditions
4. **Clean up after tests** - Reset state between tests
5. **Test both success and failure paths**
6. **Keep tests fast** - Mock external services
7. **Use test fixtures** - Reuse common setup code
8. **Document complex tests** - Add comments for clarity

---

## Performance Testing (k6)

### Install k6
```bash
# Windows (winget)
winget install k6 --source winget

# macOS
brew install k6

# Docker
docker pull grafana/k6
```

### Available Tests

| Test | File | Purpose |
|------|------|---------|
| Load | `tests/performance/k6/load-test.js` | Normal + peak traffic (10→50 users) |
| Stress | `tests/performance/k6/stress-test.js` | Beyond capacity (100→300 users) |
| Spike | `tests/performance/k6/spike-test.js` | Sudden traffic burst (5→500 users) |
| Payment API | `tests/performance/k6/payment-api-test.js` | Payment endpoint throughput |

### Run Commands

```bash
# Run against local dev server
k6 run tests/performance/k6/load-test.js

# Run against production
k6 run --env BASE_URL=https://makefarmhub.netlify.app \
       --env API_URL=https://makefarmhub.netlify.app/api \
       tests/performance/k6/load-test.js

# Stress test
k6 run tests/performance/k6/stress-test.js

# Spike test
k6 run tests/performance/k6/spike-test.js

# Payment API load test
k6 run tests/performance/k6/payment-api-test.js
```

### Performance Thresholds

| Metric | Target |
|--------|--------|
| p(95) response time | < 2000ms |
| p(99) response time (stress) | < 5000ms |
| Error rate | < 5% |
| Payment API p(95) | < 3000ms |

Results are saved to `tests/performance/results/`.

---

## Security Testing

### Automated Security Checks (k6)

```bash
# Security headers check
k6 run tests/security/header-check.js

# Input validation / injection test
k6 run tests/security/input-validation-test.js
```

### Manual Security Checklist
See `tests/security/security-checklist.md` for the full checklist covering:
- Authentication & authorization
- Payment security (replay attacks, amount tampering)
- API rate limiting
- Security headers (CSP, X-Frame-Options, etc.)
- CORS policy
- Data exposure

### Dependency Audit
```bash
npm audit
npm audit --audit-level=high
```

### OWASP ZAP (Docker)
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:5173 \
  -r tests/security/results/zap-report.html
```

---

## Continuous Improvement

Testing is an ongoing process. Regularly:
- Review and update tests
- Add tests for new features
- Improve coverage
- Update test data
- Refactor test code

---

## Support

For testing questions:
- Review this guide
- Check test examples in codebase
- Contact dev team

**Happy Testing! 🧪**
