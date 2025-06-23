import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const screenshot = async (page: Page, targetPage: TargetPage) => {
  await page.addStyleTag({
    content: '* { transition: none !important; animation: none !important; }',
  })
  await page.goto(targetPage.path, {
    waitUntil: 'domcontentloaded',
    timeout: 4000,
  })
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden()

  await page.waitForSelector('[data-testid^="rf__node-"]', {
    state: 'visible',
    timeout: 5000,
  })

  await page.keyboard.press('ControlOrMeta+.')
  await page.waitForTimeout(500)
  await expect(page.locator('[data-vercel-toolbar]')).toBeHidden({
    timeout: 1000,
  })

  await expect(page).toHaveScreenshot({
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    timeout: 5000,
  })
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
