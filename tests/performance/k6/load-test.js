/**
 * k6 Load Test - MAKEFARMHUB API
 * Tests general API performance under normal and peak load
 *
 * Run: k6 run tests/performance/k6/load-test.js
 * Run with env: k6 run --env BASE_URL=https://makefarmhub.netlify.app tests/performance/k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL = __ENV.API_URL || 'http://localhost:3000/api';

// Custom metrics
const errorRate = new Rate('error_rate');
const apiLatency = new Trend('api_latency', true);
const successfulRequests = new Counter('successful_requests');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m',  target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m',  target: 50 },   // Stay at 50 users (peak)
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:   ['rate<0.05'],   // Error rate under 5%
    error_rate:        ['rate<0.05'],
  },
};

const params = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default function () {
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`, params);
    const ok = check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage response time < 1s': (r) => r.timings.duration < 1000,
    });
    errorRate.add(!ok);
    apiLatency.add(res.timings.duration);
    if (ok) successfulRequests.add(1);
    sleep(1);
  });

  group('Marketplace Listings', () => {
    const res = http.get(`${BASE_URL}/marketplace`, params);
    const ok = check(res, {
      'marketplace status 200': (r) => r.status === 200,
      'marketplace response time < 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(!ok);
    apiLatency.add(res.timings.duration);
    if (ok) successfulRequests.add(1);
    sleep(1);
  });

  group('Static Assets', () => {
    const assets = ['/assets/index.css', '/assets/index.js'];
    assets.forEach(asset => {
      const res = http.get(`${BASE_URL}${asset}`, params);
      check(res, {
        'asset loaded': (r) => r.status === 200 || r.status === 304,
      });
    });
    sleep(0.5);
  });
}
