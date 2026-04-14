import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
  },
  webServer: {
    command: 'node scripts/playwright-dev-server.mjs',
    port: 4174,
    reuseExistingServer: true,
    timeout: 15000,
  },
});
