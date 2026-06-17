import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TENANT_ID, thresholds, authHeaders } from './config.js';

// Custom metrics
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const refreshDuration = new Trend('refresh_duration');
const authErrors = new Rate('auth_errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Stage 1: ramp up 0→50 VUs
    { duration: '2m', target: 50 },  // Stage 2: hold 50 VUs for 2 minutes
    { duration: '30s', target: 0 },  // Stage 3: ramp down 50→0
  ],
  thresholds: {
    ...thresholds,
    login_duration: ['p(95)<500'],
    register_duration: ['p(95)<500'],
    refresh_duration: ['p(95)<500'],
    auth_errors: ['rate<0.01'],
  },
};

const SEED_EMAIL = __ENV.SEED_USER_EMAIL || 'seed@test.com';
const SEED_PASSWORD = __ENV.SEED_USER_PASSWORD || 'Password123!';

export default function () {
  group('login', () => {
    const payload = JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      tenantId: TENANT_ID,
    });

    const res = http.post(`${BASE_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
    });

    loginDuration.add(res.timings.duration);

    const success = check(res, {
      'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.accessToken !== undefined || body.token !== undefined;
        } catch {
          return false;
        }
      },
      'login p95 < 500ms': (r) => r.timings.duration < 500,
    });

    authErrors.add(!success);

    sleep(1);
  });

  group('register', () => {
    const uniqueEmail = `user_${__VU}_${__ITER}@test.com`;

    const payload = JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!',
      firstName: `User${__VU}`,
      lastName: `Test${__ITER}`,
      tenantId: TENANT_ID,
    });

    const res = http.post(`${BASE_URL}/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
    });

    registerDuration.add(res.timings.duration);

    const success = check(res, {
      'register status is 201': (r) => r.status === 201,
      'register response has userId': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined || body.userId !== undefined;
        } catch {
          return false;
        }
      },
      'register p95 < 500ms': (r) => r.timings.duration < 500,
    });

    authErrors.add(!success);

    sleep(1);
  });

  group('refresh', () => {
    // First, login to get a refresh token
    const loginPayload = JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      tenantId: TENANT_ID,
    });

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
    });

    let refreshToken = null;
    if (loginRes.status === 200 || loginRes.status === 201) {
      try {
        const body = JSON.parse(loginRes.body);
        refreshToken = body.refreshToken;
      } catch {
        // body parse failed — skip refresh
      }
    }

    if (refreshToken) {
      const refreshPayload = JSON.stringify({ refreshToken });

      const res = http.post(`${BASE_URL}/auth/refresh`, refreshPayload, {
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
      });

      refreshDuration.add(res.timings.duration);

      const success = check(res, {
        'refresh status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'refresh response has new accessToken': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.accessToken !== undefined || body.token !== undefined;
          } catch {
            return false;
          }
        },
        'refresh p95 < 500ms': (r) => r.timings.duration < 500,
      });

      authErrors.add(!success);
    }

    sleep(1);
  });
}
