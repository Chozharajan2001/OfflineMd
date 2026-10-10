import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  },
});
