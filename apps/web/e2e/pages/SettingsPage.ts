import { Page, Locator, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /settings/i });
  }

  async goto() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async clickTab(name: string) {
    await this.page.getByRole('button', { name: new RegExp(name, 'i') }).click();
    await this.page.waitForTimeout(200);
  }

  async assertTabVisible(name: string) {
    await expect(
      this.page.getByRole('button', { name: new RegExp(name, 'i') })
    ).toBeVisible();
  }

  async assertPageLoaded() {
    await expect(this.heading).toBeVisible();
  }
}
