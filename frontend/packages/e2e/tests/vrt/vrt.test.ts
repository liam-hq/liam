import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const screenshot = async (page: Page, targetPage: TargetPage) => {
  await page.goto(targetPage.path)

  const cookieAcceptButton = page.getByRole('button', { name: 'Accept' })
  if ((await cookieAcceptButton.count()) > 0) {
    await cookieAcceptButton.click()
  }
  await expect(page).toHaveScreenshot({ fullPage: true })
}

interface TargetPage {
  name: string
  path: string
}

const targetPage: TargetPage = {
  name: 'top',
  path: '/',
}

test(targetPage.name, async ({ page }) => {
  await screenshot(page, targetPage)
})
