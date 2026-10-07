import { defineConfig, devices } from '@playwright/test';

import { E2E_BUILD, E2E_PORT, E2E_SUPABASE } from './e2e/build-fixture';

const isCI = Boolean(process.env['CI']);
// Optional override for environments with a preinstalled Chromium build.
const chromiumExecutable = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
const launchOptions = chromiumExecutable ? { executablePath: chromiumExecutable } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-360',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${E2E_PORT} --strictPort`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: false,
    env: {
      APP_COMMIT_SHA: E2E_BUILD.commitSha,
      APP_ENV: E2E_BUILD.environment,
      VITE_SUPABASE_URL: E2E_SUPABASE.url,
      VITE_SUPABASE_PUBLISHABLE_KEY: E2E_SUPABASE.publishableKey,
    },
  },
});
