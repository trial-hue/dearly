import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * Every spec runs at phone (390×844) and desktop (1440×900) sizes. The AI provider under test is
 * the mock unless E2E_AI_PROVIDER=claude is set with no key, which exercises the no-provider path
 * (`pnpm test:e2e:noai` runs the @noai journeys that way).
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  // The server is built first (pnpm build). The database is reset and seeded before each run so
  // scenarios start from the same state.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command:
          'pnpm exec tsx scripts/with-db.ts --migrate --reset -- pnpm exec next start -p 3000',
        url: `${baseURL}/api/health`,
        reuseExistingServer: false,
        timeout: 240_000,
        env: {
          AI_PROVIDER: process.env.E2E_AI_PROVIDER ?? 'mock',
          ANTHROPIC_API_KEY: '',
          LOG_LEVEL: 'warn',
          SESSION_SECRET: 'e2e-session-secret-not-for-production',
        },
      },
});
