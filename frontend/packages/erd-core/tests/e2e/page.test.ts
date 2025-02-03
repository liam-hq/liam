import { expect, test } from '@playwright/test'

test('Page has title', async ({ page }) => {
  await page.goto(
    'http://localhost:3001/erd/p/github.com/mastodon/mastodon/blob/main/db/schema.rb',
  )
  await expect(page).toHaveTitle(/Liam ERD/)
})
