import type { BrowserContext, TestInfo, TestType } from '@playwright/test'
import { encryptOverrides } from 'flags'

/**
 * Sets Vercel feature flag overrides for Playwright tests
 * @param test - Playwright test object
 * @param overrides - Object containing flag names and their values
 */
export function setFlagOverrides<TestArgs extends object>(
  test: TestType<TestArgs, object>,
  overrides: Record<string, boolean>,
) {
  test.beforeEach(async ({ context }) => {
    // Encrypt the flag overrides using Vercel's encryptOverrides function
    const encryptedOverrides = await encryptOverrides(overrides)

    // Get the base URL from the context
    const baseUrl = test.info().project.use?.baseURL || 'http://localhost:5173'
    const url = new URL(baseUrl)

    // Set the encrypted overrides as a cookie
    await context.addCookies([
      {
        name: 'vercel-flag-overrides',
        value: encryptedOverrides,
        domain: url.hostname,
        path: '/',
      },
    ])
  })
}

