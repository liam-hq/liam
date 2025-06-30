import { test as base, expect } from '@playwright/test'
import { setFlagOverrides } from '../../utils/flags'

// Create a custom test that doesn't use global setup
const test = base.extend({
  // Override the default storage state
  storageState: async ({}, use) => {
    await use({ cookies: [], origins: [] })
  },
})

test.describe('Login and Design Session', () => {
  // Enable the migration flag for all tests in this describe block
  setFlagOverrides(test, {
    migration: true,
  })

  test('should login with email/password and create a design session', async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto('/app/login')

    // Verify we're on the login page
    await expect(page).toHaveTitle(/Liam ERD/)
    await expect(
      page.getByRole('heading', { name: 'Sign in to Liam Migration' }),
    ).toBeVisible()

    // Fill in login credentials
    await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com')
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill('liampassword1234')

    // Click sign in button
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()

    // Wait for navigation to design sessions page
    await page.waitForURL('**/app/design_sessions/new')

    // Verify we're on the design sessions page
    await expect(
      page.getByRole('heading', {
        name: 'What can I help you Database Design?',
      }),
    ).toBeVisible()

    // Create a new design session with a message
    const testMessage = 'E2E test: Verify design session creation'
    await page
      .getByRole('textbox', { name: 'Initial message for database design' })
      .fill(testMessage)

    // Send the message
    await page.getByRole('button').filter({ hasText: 'Stop' }).click()

    // Wait for navigation to the design session page
    await page.waitForURL(/\/app\/design_sessions\/[a-f0-9-]+$/)

    // Extract the session ID from the URL
    const url = page.url()
    const sessionIdMatch = url.match(/\/app\/design_sessions\/([a-f0-9-]+)$/)
    expect(sessionIdMatch).toBeTruthy()
    const sessionId = sessionIdMatch?.[1]

    // Verify we're on the design session page with the correct ID
    expect(url).toContain(`/app/design_sessions/${sessionId}`)

    // Verify the chat interface is visible
    await expect(
      page.getByRole('combobox', { name: 'Build or ask anything, @ to' }),
    ).toBeVisible()

    // Wait for AI processing to start
    await expect(page.getByText('Processing AI Message')).toBeVisible({
      timeout: 10000,
    })
  })
})
