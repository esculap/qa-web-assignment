import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  // Fail the CI run if a stray `.only` sneaks into the suite.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // Playwright owns the app lifecycle: `npm test` is the only command needed,
  // locally and in CI. `--no-open` overrides `open: true` in vite.config.js,
  // which would otherwise try to launch a browser on a headless runner.
  webServer: {
    command: 'npm run dev -- --no-open',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
