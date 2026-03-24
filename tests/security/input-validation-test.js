/**
 * Input Validation / Injection Security Test - MAKEFARMHUB
 * Sends malformed/malicious payloads to API endpoints and verifies
 * they are rejected gracefully (no 500 errors, no data leakage).
 *
 * Run: k6 run tests/security/input-validation-test.js
 */

import http from 'k6/http';
import { check, group } from 'k6';

const API_URL = __ENV.API_URL || 'http://localhost:3000/api';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate>0.80'],
  },
};

const headers = { 'Content-Type': 'application/json' };

const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE wishlists; --",
  "1; SELECT * FROM pg_tables--",
  "' UNION SELECT null,null,null--",
];

const xssPayloads = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "javascript:alert('xss')",
  '<svg/onload=alert(1)>',
];

const oversizedPayload = 'A'.repeat(100000);

export default function () {
  group('SQL Injection - Payment Endpoint', () => {
    sqlInjectionPayloads.forEach((payload) => {
      const res = http.post(
        `${API_URL}/mobile-money-initiate`,
        JSON.stringify({
          provider: payload,
          phoneNumber: payload,
          amount: payload,
          userId: payload,
        }),
        { headers }
      );

      check(res, {
        [`SQL injection rejected (${payload.slice(0, 20)})`]: (r) =>
          r.status !== 500 && r.status !== 200,
        'no stack trace in response': (r) =>
          !r.body.includes('at Object') && !r.body.includes('stack:'),
      });
    });
  });

  group('XSS Payloads - Payment Endpoint', () => {
    xssPayloads.forEach((payload) => {
      const res = http.post(
        `${API_URL}/mobile-money-initiate`,
        JSON.stringify({
          provider: 'ecocash',
          phoneNumber: payload,
          amount: 10,
          userId: payload,
        }),
        { headers }
      );

      check(res, {
        [`XSS payload rejected (${payload.slice(0, 20)})`]: (r) =>
          r.status !== 200 || !r.body.includes(payload),
      });
    });
  });

  group('Negative / Zero Amount', () => {
    [-100, -1, 0, -0.01].forEach((amount) => {
      const res = http.post(
        `${API_URL}/mobile-money-initiate`,
        JSON.stringify({
          provider: 'ecocash',
          phoneNumber: '0771234567',
          amount,
          userId: 'test-user',
        }),
        { headers }
      );

      check(res, {
        [`Negative/zero amount ${amount} rejected`]: (r) => r.status === 400 || r.status === 422,
      });
    });
  });

  group('Oversized Payload', () => {
    const res = http.post(
      `${API_URL}/mobile-money-initiate`,
      JSON.stringify({
        provider: 'ecocash',
        phoneNumber: '0771234567',
        amount: 10,
        userId: oversizedPayload,
      }),
      { headers }
    );

    check(res, {
      'oversized payload rejected': (r) => r.status === 400 || r.status === 413 || r.status === 422,
    });
  });

  group('Missing Required Fields', () => {
    const incompletePayloads = [
      {},
      { provider: 'ecocash' },
      { provider: 'ecocash', phoneNumber: '0771234567' },
      { provider: 'ecocash', amount: 50 },
    ];

    incompletePayloads.forEach((payload) => {
      const res = http.post(
        `${API_URL}/mobile-money-initiate`,
        JSON.stringify(payload),
        { headers }
      );

      check(res, {
        'incomplete payload rejected': (r) => r.status === 400 || r.status === 422,
      });
    });
  });
}
