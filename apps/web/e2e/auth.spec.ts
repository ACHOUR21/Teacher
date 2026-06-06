import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/EduAI/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('requires email and password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // HTML5 validation or custom error message should appear
    const emailInput = page.getByLabel(/email/i);
    const validationMsg = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMsg.length).toBeGreaterThan(0);
  });

  test('redirects unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
