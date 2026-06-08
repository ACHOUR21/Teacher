import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-results.json' }],
    process.env['CI'] ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // --- Setup: log in once and save auth state ---
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // --- Unauthenticated tests (no storageState) ---
    {
      name: 'chromium-unauth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // --- Authenticated tests (reuse storageState) ---
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts|auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: /auth\.spec\.ts|auth\.setup\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      testIgnore: /auth\.spec\.ts|auth\.setup\.ts/,
      use: {
        ...devices['iPhone 14'],
        storageState: AUTH_STATE,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
