import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const screenshot = async (page: Page, targetPage: TargetPage) => {
  await page.goto(targetPage.path)
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden()

  // Turn off the Vercel Toolbar in the Preview environment.
  await page.keyboard.press('ControlOrMeta+.')

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
