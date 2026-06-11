export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
export const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
};

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-ID': TENANT_ID,
    'Content-Type': 'application/json',
  };
}
