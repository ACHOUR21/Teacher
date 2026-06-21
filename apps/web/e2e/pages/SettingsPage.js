import { expect } from '@playwright/test';
export class SettingsPage {
    page;
    heading;
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: /settings/i });
    }
    async goto() {
        await this.page.goto('/settings');
        await this.page.waitForLoadState('networkidle');
    }
    async clickTab(name) {
        await this.page.getByRole('button', { name: new RegExp(name, 'i') }).click();
        await this.page.waitForTimeout(200);
    }
    async assertTabVisible(name) {
        await expect(this.page.getByRole('button', { name: new RegExp(name, 'i') })).toBeVisible();
    }
    async assertPageLoaded() {
        await expect(this.heading).toBeVisible();
    }
}
