import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 5 : 0,
  workers: process.env.CI ? 1 : '50%',
  timeout: 30 * 1000, // 30 seconds for app tests
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        isMobile: false,
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
  ],
})
