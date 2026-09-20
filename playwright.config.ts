import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The server is built first (pnpm build). The database is reset and seeded before each run so
  // scenarios start from the same state; the AI provider is the mock so no key is needed.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command:
          'pnpm exec tsx scripts/with-db.ts --migrate --reset -- pnpm exec next start -p 3000',
        url: `${baseURL}/api/health`,
        reuseExistingServer: false,
        timeout: 240_000,
        env: {
          AI_PROVIDER: 'mock',
          LOG_LEVEL: 'warn',
          SESSION_SECRET: 'e2e-session-secret-not-for-production',
        },
      },
});
