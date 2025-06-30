import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 5 : 2,
  workers: process.env.CI ? 1 : '50%',
  timeout: 30 * 1000, // 30 seconds for app tests
  reporter: 'list',
  use: {
    baseURL: 'https://liam-erd-web.vercel.app',
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
