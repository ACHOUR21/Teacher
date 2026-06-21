"use strict";

var _testing = require("@nestjs/testing");
var _common = require("@nestjs/common");
var request = _interopRequireWildcard(require("supertest"));
var _app = require("../src/app.module");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
describe('EduAI Ultimate API (e2e)', () => {
  let app;
  let accessToken;
  let tenantId;
  beforeAll(async () => {
    const moduleFixture = await _testing.Test.createTestingModule({
      imports: [_app.AppModule]
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new _common.ValidationPipe({
      whitelist: true,
      transform: true
    }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  describe('Health Check', () => {
    it('GET /api/v1/health should return 200', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });
  describe('Authentication Flow', () => {
    const testTenantSlug = `e2e-test-${Date.now()}`;
    const adminEmail = `admin-${Date.now()}@e2e.test`;
    it('POST /api/v1/auth/register should create tenant and admin', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        tenantName: 'E2E Test School',
        tenantSlug: testTenantSlug,
        tenantType: 'SCHOOL',
        adminEmail,
        adminPassword: 'TestPassword123!',
        adminFirstName: 'Test',
        adminLastName: 'Admin'
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      accessToken = res.body.data.tokens.accessToken;
      tenantId = res.body.data.user.tenantId;
    });
    it('POST /api/v1/auth/register with duplicate slug should return 409', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        tenantName: 'Duplicate School',
        tenantSlug: testTenantSlug,
        tenantType: 'SCHOOL',
        adminEmail: `other-${Date.now()}@e2e.test`,
        adminPassword: 'TestPassword123!',
        adminFirstName: 'Other',
        adminLastName: 'Admin'
      });
      expect(res.status).toBe(409);
    });
    it('POST /api/v1/auth/login should return tokens', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/login').set('X-Tenant-ID', tenantId).send({
        email: adminEmail,
        password: 'TestPassword123!'
      });
      expect(res.status).toBe(200);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });
    it('POST /api/v1/auth/login with wrong password should return 401', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/login').set('X-Tenant-ID', tenantId).send({
        email: adminEmail,
        password: 'WrongPassword!'
      });
      expect(res.status).toBe(401);
    });
  });
  describe('Authenticated Endpoints', () => {
    it('GET /api/v1/users/me should return current user', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('email');
    });
    it('GET /api/v1/courses should return course list', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/courses').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
    it('GET /api/v1/ai/agents should list available agents', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/ai/agents').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
    it('POST /api/v1/courses should create a course', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).post('/api/v1/courses').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId).send({
        title: 'E2E Test Course',
        level: 'BEGINNER',
        price: 0,
        category: 'Mathematics'
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('E2E Test Course');
    });
    it('GET /api/v1/gamification/leaderboard should return leaderboard', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/gamification/leaderboard').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
    });
  });
  describe('Authorization Guards', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
    it('should return 401 for invalid token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me').set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
  describe('Validation', () => {
    it('should return 400 for missing required fields on register', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        tenantName: 'Incomplete'
      });
      expect(res.status).toBe(400);
    });
    it('should return 400 for invalid email format', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        tenantName: 'Test',
        tenantSlug: 'test-slug',
        tenantType: 'SCHOOL',
        adminEmail: 'not-an-email',
        adminPassword: 'Password123!',
        adminFirstName: 'Test',
        adminLastName: 'User'
      });
      expect(res.status).toBe(400);
    });
  });
  describe('Assignments', () => {
    let assignmentId;
    it('POST /api/v1/assignments should create an assignment', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).post('/api/v1/assignments').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId).send({
        title: 'E2E Assignment',
        maxScore: 100
      });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('E2E Assignment');
      assignmentId = res.body.data.id;
    });
    it('GET /api/v1/assignments should list assignments', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/assignments').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
    });
    it('GET /api/v1/assignments/:id should return assignment details', async () => {
      if (!accessToken || !assignmentId) return;
      const res = await request(app.getHttpServer()).get(`/api/v1/assignments/${assignmentId}`).set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(assignmentId);
    });
    it('PATCH /api/v1/assignments/:id should update assignment', async () => {
      if (!accessToken || !assignmentId) return;
      const res = await request(app.getHttpServer()).patch(`/api/v1/assignments/${assignmentId}`).set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId).send({
        title: 'Updated Assignment'
      });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Assignment');
    });
    it('DELETE /api/v1/assignments/:id should delete assignment', async () => {
      if (!accessToken || !assignmentId) return;
      const res = await request(app.getHttpServer()).delete(`/api/v1/assignments/${assignmentId}`).set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(204);
    });
  });
  describe('AI Endpoints', () => {
    it('GET /api/v1/ai/usage should return usage stats', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/ai/usage?period=month').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
  describe('Notifications', () => {
    it('GET /api/v1/notifications should return notifications list', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/notifications').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
    });
  });
  describe('Analytics', () => {
    it('GET /api/v1/analytics/stats should return platform stats', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/analytics/stats').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
    });
  });
  describe('Certificates', () => {
    it('GET /api/v1/certificates should return certificates list', async () => {
      if (!accessToken) return;
      const res = await request(app.getHttpServer()).get('/api/v1/certificates').set('Authorization', `Bearer ${accessToken}`).set('X-Tenant-ID', tenantId);
      expect(res.status).toBe(200);
    });
  });
});