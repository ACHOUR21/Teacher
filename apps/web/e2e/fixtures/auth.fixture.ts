import { test as base, expect, type Page } from '@playwright/test';

export type AuthFixtures = {
  /** A page already authenticated via storageState (uses global auth setup) */
  authedPage: Page;
  /** A page authenticated as the admin demo user */
  adminPage: Page;
  /** A page authenticated as the teacher demo user */
  teacherPage: Page;
  /** A page authenticated as the student demo user */
  studentPage: Page;
};

const BASE = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';
const TENANT = process.env['DEMO_TENANT'] ?? 'cmq2b4px60001fr8yjc75hsts';

export async function loginViaAPI(
  page: Page,
  email: string,
  password: string,
  tenantId = TENANT,
) {
  const resp = await page.request.post(`${BASE}/auth/login`, {
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': tenantId },
    data: { email, password },
  });
  const body = (await resp.json()) as { data?: { accessToken?: string } };
  const token = body?.data?.accessToken;
  if (!token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }
  await page.context().addCookies([]);
  await page.evaluate((t: string) => {
    localStorage.setItem('accessToken', t);
  }, token);
  return token;
}

export const test = base.extend<AuthFixtures>({
  // ── Reuse storageState set by auth.setup.ts ──────────────────────────────
  authedPage: async ({ page }, use) => {
    // storageState is applied globally via playwright.config.ts
    await page.goto('/');
    await page.waitForURL(/dashboard|\//, { timeout: 15_000 });
    await use(page);
  },

  // ── Role-specific pages (each opens a fresh browser context) ─────────────
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await loginViaAPI(
      page,
      process.env['E2E_ADMIN_EMAIL'] ?? 'admin@eduai.demo',
      process.env['E2E_ADMIN_PASSWORD'] ?? 'Admin@123456',
    );
    await use(page);
    await ctx.close();
  },

  teacherPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await loginViaAPI(
      page,
      process.env['E2E_TEACHER_EMAIL'] ?? 'teacher@demo-school.edu',
      process.env['E2E_TEACHER_PASSWORD'] ?? 'Teacher@123456',
    );
    await use(page);
    await ctx.close();
  },

  studentPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await loginViaAPI(
      page,
      process.env['E2E_STUDENT_EMAIL'] ?? 'student@demo-school.edu',
      process.env['E2E_STUDENT_PASSWORD'] ?? 'Student@123456',
    );
    await use(page);
    await ctx.close();
  },
});

export { expect };
