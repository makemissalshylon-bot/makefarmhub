/**
 * k6 Stress Test - MAKEFARMHUB
 * Pushes the system beyond normal capacity to find breaking point
 *
 * Run: k6 run tests/performance/k6/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL = __ENV.API_URL || 'http://localhost:3000/api';

const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time', true);

export const options = {
  stages: [
    { duration: '2m',  target: 100 },  // Ramp up to 100 users
    { duration: '5m',  target: 100 },  // Hold at 100
    { duration: '2m',  target: 200 },  // Ramp up to 200 (stress)
    { duration: '5m',  target: 200 },  // Hold at 200
    { duration: '2m',  target: 300 },  // Push to 300 (breaking point test)
    { duration: '5m',  target: 300 },  // Hold
    { duration: '5m',  target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'],  // 99% under 5s (lenient for stress)
    http_req_failed:   ['rate<0.20'],   // Allow up to 20% errors under stress
    error_rate:        ['rate<0.20'],
  },
};

const params = {
  headers: { 'Content-Type': 'application/json' },
};

export default function () {
  group('Core Navigation', () => {
    const pages = ['/', '/marketplace', '/auth'];
    const page = pages[Math.floor(Math.random() * pages.length)];
    const res = http.get(`${BASE_URL}${page}`, params);

    const ok = check(res, {
      'page loads': (r) => r.status === 200,
      'response under 5s': (r) => r.timings.duration < 5000,
    });
    errorRate.add(!ok);
    responseTime.add(res.timings.duration);
    sleep(Math.random() * 2);
  });
}

export function handleSummary(data) {
  return {
    'tests/performance/results/stress-summary.json': JSON.stringify(data, null, 2),
  };
}
