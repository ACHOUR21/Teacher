import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-results.json' }],
    process.env['CI'] ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env['BASE_URL'] ?? process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.js/ },
    { name: 'chromium-unauth', testMatch: /auth\.spec\.js/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.js|auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env['CI']
    ? undefined
    : { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: !process.env['CI'], timeout: 120_000 },
});
