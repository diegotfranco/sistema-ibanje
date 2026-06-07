import { defineConfig, devices } from '@playwright/test';

// Two suites share this config:
//  - `a11y`  : the existing axe accessibility scan (tests/a11y.spec.ts)
//  - `e2e`   : full frontend+backend user-flow tests (tests/e2e/**)
// The webServer block boots the API (:3000) and the web dev server (:5173) when they aren't already
// running, so `pnpm test:e2e` works from a cold checkout. Locally, an already-running stack is reused.
const PORT_WEB = 5173;
const PORT_API = 3000;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${PORT_WEB}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'a11y',
      testMatch: /a11y\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'e2e',
      testMatch: /e2e\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'pnpm --filter @sistema-ibanje/api dev',
      url: `http://localhost:${PORT_API}/auth/csrf-token`,
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe'
    },
    {
      command: 'pnpm --filter @sistema-ibanje/web dev',
      url: `http://localhost:${PORT_WEB}`,
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe'
    }
  ]
});
