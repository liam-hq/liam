import { defineConfig, devices } from '@playwright/test'

// Default test URL to avoid redirect delays
export const DEFAULT_TEST_URL = process.env.DEFAULT_TEST_URL || '/erd/p/github.com/mastodon/mastodon/blob/1bc28709ccde4106ab7d654ad5888a14c6bb1724/db/schema.rb'

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 5 : 0,
  workers: process.env.CI ? 1 : '50%',
  timeout: 10 * 1000,
  reporter: 'html',
  use: {
    baseURL: process.env.URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: 'storageState.json',
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
