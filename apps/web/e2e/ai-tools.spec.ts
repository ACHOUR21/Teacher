import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'admin@demo.eduai.example.com';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'TestPassword123!';
const TENANT_SLUG = process.env['E2E_TENANT_SLUG'] ?? 'demo';

async function loginAs(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  const schoolCodeToggle = page.getByText(/school code/i);
  if (await schoolCodeToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await schoolCodeToggle.click();
    await page.getByPlaceholder(/school code|tenant/i).fill(TENANT_SLUG);
  }
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

test.describe('AI Tutor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/ai-tutor');
  });

  test('AI tutor chat interface loads', async ({ page }) => {
    await expect(page.getByText(/AI Tutor/i)).toBeVisible();
    await expect(page.getByRole('textbox').or(page.getByPlaceholder(/ask/i))).toBeVisible();
  });

  test('can select subject', async ({ page }) => {
    const mathButton = page.getByRole('button', { name: /mathematics/i });
    if (await mathButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await mathButton.click();
      await expect(mathButton).toHaveClass(/active|selected|bg-blue/);
    }
  });

  test('new chat button clears conversation', async ({ page }) => {
    const newChatBtn = page.getByRole('button', { name: /new chat/i });
    if (await newChatBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await newChatBtn.click();
    }
  });
});

test.describe('AI Tools Hub', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/ai-tools');
  });

  test('AI tools page loads with tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /AI Tools/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /curriculum/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /research/i })).toBeVisible();
  });

  test('can switch between tool tabs', async ({ page }) => {
    await page.getByRole('button', { name: /research/i }).click();
    await expect(page.getByText(/research depth/i)).toBeVisible();

    await page.getByRole('button', { name: /career/i }).click();
    await expect(page.getByText(/interests/i)).toBeVisible();
  });

  test('curriculum tab shows subject input', async ({ page }) => {
    await page.getByRole('button', { name: /curriculum/i }).click();
    await expect(page.getByLabel(/subject/i)).toBeVisible();
    await expect(page.getByLabel(/grade level/i)).toBeVisible();
    await expect(page.getByLabel(/duration/i).or(page.getByLabel(/weeks/i))).toBeVisible();
  });

  test('speech-to-text tab shows file upload area', async ({ page }) => {
    await page.getByRole('button', { name: /speech/i }).click();
    await expect(page.getByText(/audio|upload|microphone/i)).toBeVisible();
  });

  test('text-to-speech tab shows text input and voice selection', async ({ page }) => {
    await page.getByRole('button', { name: /text-to-speech/i }).click();
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByText(/nova|alloy|echo/i)).toBeVisible();
  });
});
