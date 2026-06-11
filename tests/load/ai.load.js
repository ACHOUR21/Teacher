import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TENANT_ID, authHeaders } from './config.js';

// Custom metrics — AI endpoints have higher latency thresholds
const aiChatDuration = new Trend('ai_chat_duration');
const flashcardsDuration = new Trend('ai_flashcards_duration');
const aiErrors = new Rate('ai_errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Stage 1: ramp 0→10 VUs over 30s (AI is expensive)
    { duration: '3m', target: 10 },  // Stage 2: hold 10 VUs for 3 minutes
    { duration: '30s', target: 0 },  // Stage 3: ramp down
  ],
  thresholds: {
    // AI endpoints are slower — allow up to 5s p95
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
    ai_chat_duration: ['p(95)<5000'],
    ai_flashcards_duration: ['p(95)<5000'],
    ai_errors: ['rate<0.05'],
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
    aiErrors.add(1);
    sleep(2);
    return;
  }

  const headers = authHeaders(token);

  group('ai chat', () => {
    const payload = JSON.stringify({
      message: 'Explain photosynthesis',
      subject: 'biology',
    });

    // AI requests can take several seconds — set a generous timeout
    const res = http.post(`${BASE_URL}/ai/chat`, payload, {
      headers,
      timeout: '30s',
    });

    aiChatDuration.add(res.timings.duration);

    const success = check(res, {
      'ai chat status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'ai chat response has content': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.content !== undefined ||
            body.message !== undefined ||
            body.response !== undefined
          );
        } catch {
          return false;
        }
      },
      'ai chat p95 < 5000ms': (r) => r.timings.duration < 5000,
    });

    aiErrors.add(!success);

    // Longer sleep between AI calls to avoid hammering LLM APIs
    sleep(3);
  });

  group('generate flashcards', () => {
    const payload = JSON.stringify({
      topic: 'World War 2',
      count: 5,
    });

    const res = http.post(`${BASE_URL}/ai/flashcards/generate`, payload, {
      headers,
      timeout: '30s',
    });

    flashcardsDuration.add(res.timings.duration);

    const success = check(res, {
      'flashcards status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'flashcards response has cards array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            Array.isArray(body.flashcards) ||
            Array.isArray(body.cards) ||
            Array.isArray(body)
          );
        } catch {
          return false;
        }
      },
      'flashcards p95 < 5000ms': (r) => r.timings.duration < 5000,
    });

    aiErrors.add(!success);

    sleep(3);
  });
}
