import { expect, test } from '@playwright/test'

const url =
  process.env.ERD_WEB_URL ||
  'http://localhost:3001/erd/p/github.com/mastodon/mastodon/blob/main/db/schema.rb'

test('Page has title', async ({ page }) => {
  await page.goto(url)
  await expect(page).toHaveTitle(/Liam ERD/)
})
