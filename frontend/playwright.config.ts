import { defineConfig } from '@playwright/test';

const DEFAULT_BASE_URL = 'https://tourist-grade.pages.dev';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL;
const isLocalBaseUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(baseURL);

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
  },
  webServer: isLocalBaseUrl
    ? {
        command: 'node scripts/playwright-dev-server.mjs',
        port: 4174,
        reuseExistingServer: true,
        timeout: 15000,
      }
    : undefined,
});
