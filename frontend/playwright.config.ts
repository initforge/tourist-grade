import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4176',
    headless: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4174',
    port: 4174,
    reuseExistingServer: true,
    timeout: 15000,
  },
});
