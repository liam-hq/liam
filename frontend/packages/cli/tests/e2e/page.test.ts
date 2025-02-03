import { expect, test } from '@playwright/test'

test('Page has title', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page).toHaveTitle('Liam ERD')
})
