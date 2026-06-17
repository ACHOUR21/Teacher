import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TENANT_ID, authHeaders } from './config.js';

// Custom metrics — billing reads should be fast
const plansDuration = new Trend('billing_plans_duration');
const subscriptionDuration = new Trend('billing_subscription_duration');
const invoicesDuration = new Trend('billing_invoices_duration');
const billingErrors = new Rate('billing_errors');

export const options = {
  vus: 20,
  duration: '2m',
  thresholds: {
    // Billing read endpoints should be very fast
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    billing_plans_duration: ['p(95)<300'],
    billing_subscription_duration: ['p(95)<300'],
    billing_invoices_duration: ['p(95)<300'],
    billing_errors: ['rate<0.01'],
  },
};

const SEED_EMAIL = __ENV.SEED_USER_EMAIL || 'seed@test.com';
const SEED_PASSWORD = __ENV.SEED_USER_PASSWORD || 'Password123!';

// VU-level token cache
let vuToken = null;

function getToken() {
  if (vuToken) return vuToken;

  const payload = JSON.stringify({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    tenantId: TENANT_ID,
  });

  const res = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
  });

  if (res.status === 200 || res.status === 201) {
    try {
      const body = JSON.parse(res.body);
      vuToken = body.accessToken || body.token;
    } catch {
      // parse error
    }
  }

  return vuToken;
}

export default function () {
  const token = getToken();

  if (!token) {
    billingErrors.add(1);
    sleep(1);
    return;
  }

  const headers = authHeaders(token);

  group('list billing plans', () => {
    const res = http.get(`${BASE_URL}/billing/plans`, { headers });

    plansDuration.add(res.timings.duration);

    const success = check(res, {
      'billing plans status is 200': (r) => r.status === 200,
      'billing plans returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.plans) || Array.isArray(body);
        } catch {
          return false;
        }
      },
      'billing plans p95 < 300ms': (r) => r.timings.duration < 300,
    });

    billingErrors.add(!success);
    sleep(0.5);
  });

  group('get current subscription', () => {
    const res = http.get(`${BASE_URL}/billing/subscription`, { headers });

    subscriptionDuration.add(res.timings.duration);

    const success = check(res, {
      'subscription status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'subscription p95 < 300ms': (r) => r.timings.duration < 300,
    });

    billingErrors.add(!success);
    sleep(0.5);
  });

  group('get invoice history', () => {
    const res = http.get(`${BASE_URL}/billing/invoices`, { headers });

    invoicesDuration.add(res.timings.duration);

    const success = check(res, {
      'invoices status is 200': (r) => r.status === 200,
      'invoices returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            Array.isArray(body.invoices) ||
            Array.isArray(body.data) ||
            Array.isArray(body)
          );
        } catch {
          return false;
        }
      },
      'invoices p95 < 300ms': (r) => r.timings.duration < 300,
    });

    billingErrors.add(!success);
    sleep(1);
  });
}
