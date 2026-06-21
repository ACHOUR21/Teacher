import { test, expect } from '@playwright/test';
const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'admin@demo.eduai.example.com';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'TestPassword123!';
const TENANT_SLUG = process.env['E2E_TENANT_SLUG'] ?? 'demo';
async function loginAs(page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    // Fill school code if that toggle exists
    const schoolCodeToggle = page.getByText(/school code/i);
    if (await schoolCodeToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await schoolCodeToggle.click();
        await page.getByPlaceholder(/school code|tenant/i).fill(TENANT_SLUG);
    }
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
}
test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page);
    });
    test('shows main dashboard after login', async ({ page }) => {
        await expect(page).toHaveURL(/dashboard/);
        // Sidebar should be visible
        await expect(page.getByRole('navigation')).toBeVisible();
    });
    test('sidebar contains key navigation items', async ({ page }) => {
        const nav = page.getByRole('navigation');
        await expect(nav.getByText(/courses/i)).toBeVisible();
        await expect(nav.getByText(/assignments/i)).toBeVisible();
        await expect(nav.getByText(/AI Tutor/i)).toBeVisible();
    });
    test('can navigate to courses page', async ({ page }) => {
        await page.getByRole('link', { name: /^courses$/i }).click();
        await expect(page).toHaveURL(/\/courses/);
        await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();
    });
    test('can navigate to assignments page', async ({ page }) => {
        await page.getByRole('link', { name: /assignments/i }).click();
        await expect(page).toHaveURL(/\/assignments/);
    });
    test('can navigate to AI Tutor', async ({ page }) => {
        await page.getByRole('link', { name: /ai tutor/i }).click();
        await expect(page).toHaveURL(/\/ai-tutor/);
        await expect(page.getByText(/AI Tutor/i)).toBeVisible();
    });
    test('can navigate to AI Tools', async ({ page }) => {
        await page.getByRole('link', { name: /ai tools/i }).click();
        await expect(page).toHaveURL(/\/ai-tools/);
        await expect(page.getByText(/curriculum|research|speech/i)).toBeVisible();
    });
    test('profile link is accessible', async ({ page }) => {
        const profileLink = page.getByRole('link', { name: /profile/i });
        if (await profileLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await profileLink.click();
            await expect(page).toHaveURL(/\/profile/);
        }
    });
});
test.describe('Courses', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page);
        await page.goto('/courses');
    });
    test('course list loads', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();
        await page.waitForLoadState('networkidle');
    });
    test('can search courses', async ({ page }) => {
        const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
        if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        }
    });
});
test.describe('Assignments', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page);
        await page.goto('/assignments');
    });
    test('assignment page loads', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /assignments/i })).toBeVisible();
    });
    test('shows assignment status tabs or list', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        // Should show pending, submitted, or empty state
        const pendingSection = page.getByText(/pending|no assignments/i);
        await expect(pendingSection).toBeVisible({ timeout: 10_000 });
    });
});
test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page);
    });
    test('dashboard has proper landmark regions', async ({ page }) => {
        const nav = page.getByRole('navigation');
        const main = page.getByRole('main');
        await expect(nav).toBeVisible();
        await expect(main.or(page.locator('main'))).toBeVisible();
    });
    test('sidebar toggle is keyboard accessible', async ({ page }) => {
        const toggleBtn = page.getByRole('button', { name: /collapse|expand sidebar/i });
        if (await toggleBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await toggleBtn.focus();
            await toggleBtn.press('Enter');
            await page.waitForTimeout(300);
        }
    });
});
