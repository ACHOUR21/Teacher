import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, TENANT_ID, thresholds, authHeaders } from './config.js';

// Custom metrics
const listCoursesDuration = new Trend('list_courses_duration');
const getCourseDuration = new Trend('get_course_duration');
const enrollDuration = new Trend('enroll_duration');
const progressDuration = new Trend('get_progress_duration');
const ttfb = new Trend('courses_ttfb');
const courseErrors = new Rate('course_errors');

// Seeded course IDs for random selection
const SEEDED_COURSE_IDS = [
  'course-001',
  'course-002',
  'course-003',
  'course-004',
  'course-005',
  'course-006',
  'course-007',
  'course-008',
  'course-009',
  'course-010',
];

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Stage 1: ramp 0→100 VUs over 1 minute
    { duration: '5m', target: 100 },  // Stage 2: hold 100 VUs for 5 minutes
    { duration: '1m', target: 0 },    // Stage 3: ramp down over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    list_courses_duration: ['p(95)<500', 'p(99)<1000'],
    get_course_duration: ['p(95)<500', 'p(99)<1000'],
    enroll_duration: ['p(95)<500', 'p(99)<1000'],
    get_progress_duration: ['p(95)<500', 'p(99)<1000'],
    course_errors: ['rate<0.01'],
  },
};

const SEED_EMAIL = __ENV.SEED_USER_EMAIL || 'seed@test.com';
const SEED_PASSWORD = __ENV.SEED_USER_PASSWORD || 'Password123!';

// Setup: login once per VU at the start and reuse token
export function setup() {
  // This runs once globally before VUs start — use for data seeding if needed
  return {};
}

// VU-level token cache (persists across iterations for same VU)
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
      // parse error — return null
    }
  }

  return vuToken;
}

function randomCourseId() {
  return SEEDED_COURSE_IDS[Math.floor(Math.random() * SEEDED_COURSE_IDS.length)];
}

export default function () {
  const token = getToken();

  if (!token) {
    // Cannot proceed without auth — count as error and skip
    courseErrors.add(1);
    sleep(1);
    return;
  }

  const headers = authHeaders(token);

  group('list courses', () => {
    const res = http.get(`${BASE_URL}/courses?page=1&limit=20`, { headers });

    listCoursesDuration.add(res.timings.duration);
    ttfb.add(res.timings.waiting); // TTFB = time waiting for first byte

    const success = check(res, {
      'list courses status is 200': (r) => r.status === 200,
      'list courses returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || Array.isArray(body.courses) || Array.isArray(body);
        } catch {
          return false;
        }
      },
      'list courses p95 < 500ms': (r) => r.timings.duration < 500,
    });

    courseErrors.add(!success);
    sleep(0.5);
  });

  group('get course', () => {
    const courseId = randomCourseId();
    const res = http.get(`${BASE_URL}/courses/${courseId}`, { headers });

    getCourseDuration.add(res.timings.duration);

    const success = check(res, {
      'get course status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'get course p95 < 500ms': (r) => r.timings.duration < 500,
    });

    courseErrors.add(!success);
    sleep(0.5);
  });

  group('enroll', () => {
    const courseId = randomCourseId();
    const res = http.post(`${BASE_URL}/courses/${courseId}/enroll`, null, { headers });

    enrollDuration.add(res.timings.duration);

    // 201 = enrolled, 409 = already enrolled (idempotent — both are acceptable)
    const success = check(res, {
      'enroll status is 201 or 409': (r) => r.status === 201 || r.status === 409,
      'enroll p95 < 500ms': (r) => r.timings.duration < 500,
    });

    courseErrors.add(!success);
    sleep(0.5);
  });

  group('get progress', () => {
    const courseId = randomCourseId();
    const res = http.get(`${BASE_URL}/courses/${courseId}/progress`, { headers });

    progressDuration.add(res.timings.duration);

    const success = check(res, {
      'get progress status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'get progress p99 < 1000ms': (r) => r.timings.duration < 1000,
    });

    courseErrors.add(!success);
    sleep(1);
  });
}
