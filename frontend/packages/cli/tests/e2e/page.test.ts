import { expect, test } from '@playwright/test'

const url = process.env.CLI_URL || 'http://localhost:5173'

test('Page has title', async ({ page }) => {
  await page.goto(url)
  await expect(page).toHaveTitle('Liam ERD')
})
