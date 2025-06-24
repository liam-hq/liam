import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { DEFAULT_TEST_URL } from '../../playwright.config'

const waitForPageReady = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('load')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden()
}

const screenshot = async (page: Page, targetPage: TargetPage) => {
  // Disable Vercel Toolbar for automation
  await page.setExtraHTTPHeaders({
    'x-vercel-skip-toolbar': '1',
  })

  await page.goto(targetPage.path)
  await waitForPageReady(page)

  await expect(page).toHaveScreenshot({ fullPage: true })
}

interface TargetPage {
  name: string
  path: string
}

const targetPage: TargetPage = {
  name: 'top',
  path: DEFAULT_TEST_URL,
}

test(targetPage.name, async ({ page }) => {
  await screenshot(page, targetPage)
})
