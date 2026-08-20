import { defineConfig, devices } from '@playwright/test';

/**
 * Point the suite at an already-running dev server with
 * `PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test`.
 *
 * Without it, Playwright starts its own server on 3000. Two `next dev`
 * processes sharing one `.next` directory corrupt each other's webpack
 * runtime, so when a dev server is already up, reuse it rather than racing it.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const useExternalServer = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  /**
   * The default 5s assumes a built app. Against `next dev` the first hit on a
   * route compiles it on demand, which regularly takes longer than that — so
   * behavioural assertions were failing on compile latency, not on behaviour.
   */
  expect: { timeout: 10_000 },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 60000,
        },
      }),
});
