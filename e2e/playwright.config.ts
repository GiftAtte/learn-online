import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests drive the real app in a real browser. They need the database to be migrated and
 * seeded (`npm run db:migrate && npm run db:seed` in ../api). The API (port 4100) and the client
 * (port 5273) are started for you.
 *
 * Uses the locally installed Chrome so no browser download is needed; set E2E_BROWSER=msedge or
 * `chromium` (after `npx playwright install chromium`) to change it.
 */
// Dedicated ports, so the tests never talk to a dev server (or another project) on the usual ones.
const API_PORT = 4100;
const CLIENT_PORT = 5273;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    channel: process.env.E2E_BROWSER ?? 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../api',
      env: { PORT: String(API_PORT), CLIENT_ORIGIN: `http://localhost:${CLIENT_PORT}` },
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run dev -- --port ${CLIENT_PORT} --strictPort`,
      cwd: '../client',
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
