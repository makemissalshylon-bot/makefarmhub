/**
 * k6 Payment API Performance Test - MAKEFARMHUB
 * Tests mobile money payment endpoints under load
 *
 * Run: k6 run tests/performance/k6/payment-api-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const API_URL = __ENV.API_URL || 'http://localhost:3000/api';

const paymentErrors = new Rate('payment_errors');
const paymentLatency = new Trend('payment_latency', true);
const paymentsInitiated = new Counter('payments_initiated');

export const options = {
  stages: [
    { duration: '1m',  target: 20 },
    { duration: '3m',  target: 20 },
    { duration: '1m',  target: 50 },
    { duration: '3m',  target: 50 },
    { duration: '1m',  target: 0 },
  ],
  thresholds: {
    http_req_duration:  ['p(95)<3000'],  // Payment API under 3s
    http_req_failed:    ['rate<0.05'],
    payment_errors:     ['rate<0.05'],
    payment_latency:    ['p(95)<3000'],
  },
};

const providers = ['ecocash', 'onemoney', 'innbucks', 'telecash'];
const phones = {
  ecocash: '0771234567',
  onemoney: '0711234567',
  innbucks: '0771234567',
  telecash: '0731234567',
};

export default function () {
  const provider = providers[Math.floor(Math.random() * providers.length)];

  group('Mobile Money Initiate', () => {
    const payload = JSON.stringify({
      provider,
      phoneNumber: phones[provider],
      amount: Math.floor(Math.random() * 500) + 10,
      userId: `load-test-user-${__VU}`,
      orderId: `load-test-order-${__VU}-${__ITER}`,
    });

    const res = http.post(`${API_URL}/mobile-money-initiate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const ok = check(res, {
      'initiate status 2xx or 4xx': (r) => r.status < 500,
      'initiate response time < 3s': (r) => r.timings.duration < 3000,
      'has transactionRef or error': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.transactionRef !== undefined || body.message !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    paymentErrors.add(!ok);
    paymentLatency.add(res.timings.duration);
    if (ok) paymentsInitiated.add(1);
    sleep(2);
  });

  group('Payment Status Check', () => {
    const payload = JSON.stringify({
      transactionRef: `MM-${provider.toUpperCase()}-LOAD-${__VU}-${__ITER}`,
      provider,
    });

    const res = http.post(`${API_URL}/mobile-money-status`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'status check responds': (r) => r.status < 500,
      'status check fast': (r) => r.timings.duration < 2000,
    });
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'tests/performance/results/payment-api-summary.json': JSON.stringify(data, null, 2),
  };
}
