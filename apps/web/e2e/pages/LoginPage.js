import { expect } from '@playwright/test';
export class LoginPage {
    page;
    emailInput;
    passwordInput;
    submitButton;
    schoolCodeToggle;
    schoolCodeInput;
    forgotPasswordLink;
    registerLink;
    googleButton;
    rememberMeCheckbox;
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.submitButton = page.getByRole('button', { name: /sign in/i });
        this.schoolCodeToggle = page.getByText(/school code/i);
        this.schoolCodeInput = page.getByPlaceholder(/demo-school/i);
        this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
        this.registerLink = page.getByRole('link', { name: /create one free/i });
        this.googleButton = page.getByRole('button', { name: /continue with google/i });
        this.rememberMeCheckbox = page.locator('#rememberMe');
    }
    async goto() {
        await this.page.goto('/login');
    }
    async login(email, password, schoolCode) {
        await this.goto();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        if (schoolCode) {
            await this.schoolCodeToggle.click();
            await this.schoolCodeInput.fill(schoolCode);
        }
        await this.submitButton.click();
    }
    async loginAndWaitForDashboard(email, password, schoolCode) {
        await this.login(email, password, schoolCode);
        await this.page.waitForURL(/dashboard/, { timeout: 20_000 });
    }
    async assertVisible() {
        await expect(this.page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }
    async assertValidationError(field) {
        const fieldEl = field === 'email' ? this.emailInput : this.passwordInput;
        const msg = await fieldEl.evaluate((el) => el.validationMessage);
        expect(msg.length).toBeGreaterThan(0);
    }
}
