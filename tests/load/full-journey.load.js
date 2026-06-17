import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, TENANT_ID, authHeaders } from './config.js';

// Custom metrics for end-to-end journey
const journeyDuration = new Trend('full_journey_duration');
const journeyErrors = new Rate('full_journey_errors');
const completedJourneys = new Counter('completed_journeys');

// Seeded course IDs for enrollment step
const SEEDED_COURSE_IDS = [
  'course-001',
  'course-002',
  'course-003',
  'course-004',
  'course-005',
];

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up
    { duration: '5m', target: 20 },  // 5 minute steady state with 20 VUs
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    full_journey_duration: ['p(95)<30000'], // Full journey should complete in < 30s
    full_journey_errors: ['rate<0.05'],
  },
};

function randomCourseId() {
  return SEEDED_COURSE_IDS[Math.floor(Math.random() * SEEDED_COURSE_IDS.length)];
}

export default function () {
  const journeyStart = Date.now();
  let journeyFailed = false;

  // Step 1: Register a new account
  let accessToken = null;
  let userId = null;

  group('step 1: register account', () => {
    const uniqueEmail = `journey_${__VU}_${__ITER}_${Date.now()}@test.com`;

    const payload = JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!',
      firstName: `Journey${__VU}`,
      lastName: `User${__ITER}`,
      tenantId: TENANT_ID,
    });

    const res = http.post(`${BASE_URL}/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
    });

    const ok = check(res, {
      'register: status 201': (r) => r.status === 201,
      'register: has userId': (r) => {
        try {
          const body = JSON.parse(r.body);
          userId = body.id || body.userId;
          return userId !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (!ok) {
      // Fall back to seed user login if registration fails (e.g. email already exists)
      const loginPayload = JSON.stringify({
        email: __ENV.SEED_USER_EMAIL || 'seed@test.com',
        password: __ENV.SEED_USER_PASSWORD || 'Password123!',
        tenantId: TENANT_ID,
      });

      const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
      });

      if (loginRes.status === 200 || loginRes.status === 201) {
        try {
          const body = JSON.parse(loginRes.body);
          accessToken = body.accessToken || body.token;
        } catch {
          journeyFailed = true;
        }
      } else {
        journeyFailed = true;
      }
    } else {
      try {
        const body = JSON.parse(res.body);
        accessToken = body.accessToken || body.token;
      } catch {
        journeyFailed = true;
      }
    }
  });

  if (journeyFailed || !accessToken) {
    journeyErrors.add(1);
    return;
  }

  // Simulate user reading the registration confirmation screen
  sleep(Math.random() * 2 + 1);

  const headers = authHeaders(accessToken);

  // Step 2: Browse course catalog
  group('step 2: browse course catalog', () => {
    const res = http.get(`${BASE_URL}/courses?page=1&limit=20`, { headers });

    check(res, {
      'browse catalog: status 200': (r) => r.status === 200,
      'browse catalog: has courses': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            Array.isArray(body.data) ||
            Array.isArray(body.courses) ||
            Array.isArray(body)
          );
        } catch {
          return false;
        }
      },
    });
  });

  // Simulate user browsing the catalog
  sleep(Math.random() * 2 + 1);

  const selectedCourseId = randomCourseId();

  // Step 3: Enroll in a course
  group('step 3: enroll in course', () => {
    const res = http.post(`${BASE_URL}/courses/${selectedCourseId}/enroll`, null, { headers });

    check(res, {
      'enroll: status 201 or 409': (r) => r.status === 201 || r.status === 409,
    });
  });

  // Simulate user looking at enrollment confirmation
  sleep(Math.random() * 2 + 1);

  // Step 4: View first lesson
  group('step 4: view first lesson', () => {
    const res = http.get(
      `${BASE_URL}/courses/${selectedCourseId}/lessons?page=1&limit=1`,
      { headers }
    );

    check(res, {
      'view lesson: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });

    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        const lessons = body.data || body.lessons || body;
        if (Array.isArray(lessons) && lessons.length > 0) {
          const lessonId = lessons[0].id;
          if (lessonId) {
            const lessonRes = http.get(
              `${BASE_URL}/courses/${selectedCourseId}/lessons/${lessonId}`,
              { headers }
            );
            check(lessonRes, {
              'lesson detail: status 200': (r) => r.status === 200,
            });
          }
        }
      } catch {
        // parse error — continue journey
      }
    }
  });

  // Simulate user reading lesson content
  sleep(Math.random() * 2 + 1);

  // Step 5: Ask AI tutor a question
  group('step 5: ask ai tutor', () => {
    const payload = JSON.stringify({
      message: 'Can you explain the key concepts from this lesson?',
      subject: 'general',
      courseId: selectedCourseId,
    });

    const res = http.post(`${BASE_URL}/ai/chat`, payload, {
      headers,
      timeout: '30s',
    });

    check(res, {
      'ai tutor: status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'ai tutor: has response': (r) => {
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
    });
  });

  // Simulate user reading AI response
  sleep(Math.random() * 2 + 1);

  // Step 6: Check notifications
  group('step 6: check notifications', () => {
    const res = http.get(`${BASE_URL}/notifications?page=1&limit=10`, { headers });

    check(res, {
      'notifications: status 200': (r) => r.status === 200,
      'notifications: has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            Array.isArray(body.notifications) ||
            Array.isArray(body.data) ||
            Array.isArray(body)
          );
        } catch {
          return false;
        }
      },
    });
  });

  // Record completed journey metrics
  const totalDuration = Date.now() - journeyStart;
  journeyDuration.add(totalDuration);
  completedJourneys.add(1);
  journeyErrors.add(0); // successful journey

  // Final pause before next iteration
  sleep(Math.random() * 2 + 1);
}
