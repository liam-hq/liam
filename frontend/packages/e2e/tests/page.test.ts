import { expect, test } from '@playwright/test'

test('Page has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Liam ERD/)
})

test('Copy link button copies current URL to clipboard', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.goto('/')

  const copyButton = page.getByRole('button', { name: 'Copy Link' })
  await copyButton.click()

  const clipboardContent = await page.evaluate(() =>
    navigator.clipboard.readText(),
  )
  expect(clipboardContent).toBe(page.url())
})
