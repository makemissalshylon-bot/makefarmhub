/**
 * k6 Spike Test - MAKEFARMHUB
 * Simulates sudden traffic spikes (e.g. market opening, harvest season rush)
 *
 * Run: k6 run tests/performance/k6/spike-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Normal baseline
    { duration: '1m',  target: 5 },    // Baseline hold
    { duration: '10s', target: 500 },  // Sudden spike to 500 users
    { duration: '3m',  target: 500 },  // Hold spike
    { duration: '10s', target: 5 },    // Quick drop back
    { duration: '3m',  target: 5 },    // Recovery observation
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.30'],    // Allow up to 30% errors during spike
    http_req_duration: ['p(95)<10000'], // 95% under 10s during spike
  },
};

export default function () {
  group('Spike - Marketplace', () => {
    const res = http.get(`${BASE_URL}/marketplace`, {
      headers: { 'Accept': 'text/html' },
    });

    const ok = check(res, {
      'page responds': (r) => r.status < 500,
    });
    errorRate.add(!ok);
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'tests/performance/results/spike-summary.json': JSON.stringify(data, null, 2),
  };
}
