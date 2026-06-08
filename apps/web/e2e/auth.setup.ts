/**
 * Global auth setup — runs once before all authenticated test projects.
 * Logs in and saves browser storage state so subsequent tests skip login.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'admin@demo.eduai.example.com';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'TestPassword123!';
const TENANT_SLUG = process.env['E2E_TENANT_SLUG'] ?? 'demo';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  await page.locator('#email').fill(TEST_EMAIL);
  await page.locator('#password').fill(TEST_PASSWORD);

  // Expand school code if tenant slug is set
  if (TENANT_SLUG) {
    await page.getByText(/school code/i).click();
    await page.getByPlaceholder(/demo-school/i).fill(TENANT_SLUG);
  }

  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole('navigation')).toBeVisible();

  // Save authenticated storage state for reuse
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
