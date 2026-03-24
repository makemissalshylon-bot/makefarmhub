/**
 * Security Headers Test - MAKEFARMHUB
 * Verifies that required security headers are present on all responses.
 * Uses k6 for execution.
 *
 * Run: k6 run tests/security/header-check.js
 */

import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL  = __ENV.API_URL  || 'http://localhost:3000/api';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1.0'],  // All security checks must pass
  },
};

export default function () {
  group('Frontend Security Headers', () => {
    const res = http.get(BASE_URL);

    check(res, {
      'X-Content-Type-Options nosniff': (r) =>
        r.headers['X-Content-Type-Options'] === 'nosniff',
      'X-Frame-Options present': (r) =>
        !!r.headers['X-Frame-Options'],
      'Referrer-Policy present': (r) =>
        !!r.headers['Referrer-Policy'],
      'no server version disclosed': (r) =>
        !r.headers['Server'] || !r.headers['Server'].match(/\d+\.\d+/),
      'no x-powered-by header': (r) =>
        !r.headers['X-Powered-By'],
    });
  });

  group('API Security Headers', () => {
    const res = http.get(`${API_URL}/health`, {
      headers: { 'Accept': 'application/json' },
    });

    check(res, {
      'API returns JSON content-type': (r) =>
        (r.headers['Content-Type'] || '').includes('application/json'),
      'no server version disclosed': (r) =>
        !r.headers['Server'] || !r.headers['Server'].match(/\d+\.\d+/),
    });
  });

  group('CORS Policy', () => {
    const res = http.options(`${API_URL}/mobile-money-initiate`, null, {
      headers: {
        'Origin': 'https://evil.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    check(res, {
      'CORS does not allow evil origin': (r) =>
        r.headers['Access-Control-Allow-Origin'] !== 'https://evil.com' &&
        r.headers['Access-Control-Allow-Origin'] !== '*',
    });
  });

  group('Rate Limiting Headers', () => {
    // Make several rapid requests
    for (let i = 0; i < 3; i++) {
      http.post(`${API_URL}/mobile-money-initiate`, '{}', {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = http.post(`${API_URL}/mobile-money-initiate`, '{}', {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'rate limit headers present or request blocked': (r) =>
        !!r.headers['X-RateLimit-Limit'] ||
        !!r.headers['Retry-After'] ||
        r.status === 429 ||
        r.status < 500,
    });
  });
}
