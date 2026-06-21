import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
test.describe('Login page', () => {
    test('renders all required elements', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.assertVisible();
        await expect(loginPage.googleButton).toBeVisible();
        await expect(loginPage.forgotPasswordLink).toBeVisible();
        await expect(loginPage.registerLink).toBeVisible();
        await expect(loginPage.rememberMeCheckbox).toBeVisible();
    });
    test('page title includes EduAI', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/EduAI/i);
    });
    test('email validation error when submitting empty form', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.submitButton.click();
        await loginPage.assertValidationError('email');
    });
    test('password validation error when only email is filled', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.emailInput.fill('user@test.com');
        await loginPage.submitButton.click();
        await loginPage.assertValidationError('password');
    });
    test('shows inline error for invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.login('wrong@example.com', 'WrongPass123!');
        await expect(page.getByText(/invalid|incorrect|failed|sign in failed/i)).toBeVisible({ timeout: 10_000 });
    });
    test('password visibility toggle works', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.passwordInput.fill('secret');
        const toggleBtn = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).last();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
        await toggleBtn.click();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
        await toggleBtn.click();
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });
    test('school code section expands on toggle click', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        // School code input hidden initially
        await expect(loginPage.schoolCodeInput).not.toBeVisible();
        await loginPage.schoolCodeToggle.click();
        await expect(loginPage.schoolCodeInput).toBeVisible();
    });
    test('school code section collapses on second click', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.schoolCodeToggle.click();
        await expect(loginPage.schoolCodeInput).toBeVisible();
        await loginPage.schoolCodeToggle.click();
        await expect(loginPage.schoolCodeInput).not.toBeVisible();
    });
    test('unauthenticated user redirected from dashboard to login', async ({ page }) => {
        await page.goto('/');
        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');
    });
    test('unauthenticated user redirected from settings to login', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');
    });
    test('register link navigates to register page', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.registerLink.click();
        await expect(page).toHaveURL(/register/);
    });
    test('forgot password link navigates to forgot-password page', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.forgotPasswordLink.click();
        await expect(page).toHaveURL(/forgot-password/);
    });
});
test.describe('Forgot password page', () => {
    test('renders email input and submit button', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByRole('heading', { name: /forgot/i })).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    });
    test('shows success message after submitting email', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.locator('input[type="email"]').fill('user@example.com');
        await page.getByRole('button', { name: /send/i }).click();
        await expect(page.getByText(/check your email|link sent|reset link/i)).toBeVisible({ timeout: 10_000 });
    });
    test('back to login link works', async ({ page }) => {
        await page.goto('/forgot-password');
        const backLink = page.getByRole('link', { name: /back|sign in/i });
        if (await backLink.isVisible()) {
            await backLink.click();
            await expect(page).toHaveURL(/login/);
        }
    });
});
test.describe('Register page', () => {
    test('renders registration form', async ({ page }) => {
        await page.goto('/register');
        await expect(page.getByRole('heading', { name: /create|register|sign up/i })).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });
    test('already-have-account link goes to login', async ({ page }) => {
        await page.goto('/register');
        const loginLink = page.getByRole('link', { name: /sign in|login/i });
        if (await loginLink.isVisible()) {
            await loginLink.click();
            await expect(page).toHaveURL(/login/);
        }
    });
});
