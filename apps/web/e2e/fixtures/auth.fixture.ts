import { test as base, expect, Page } from '@playwright/test';

export type AuthFixtures = {
  /** A page already authenticated via storageState */
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    // storageState is applied globally via playwright.config.ts
    // Navigate to dashboard to confirm session is valid
    await page.goto('/');
    await page.waitForURL(/dashboard|\//, { timeout: 15_000 });
    await use(page);
  },
});

export { expect };
