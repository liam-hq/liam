import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 5 : 0,
  workers: process.env['CI'] ? 1 : '50%',
  timeout: 20 * 1000,
  reporter: 'html',
  use: {
    baseURL: process.env['URL'] || 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: 'storageState.json',
    actionTimeout: 8000,
    navigationTimeout: 8000,
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
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'], isMobile: true },
    },
  ],
})
