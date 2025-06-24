import { chromium, type FullConfig } from '@playwright/test'
import { DEFAULT_TEST_URL } from './playwright.config'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${baseURL}${DEFAULT_TEST_URL}`)

  const cookieButton = page.getByRole('button', {
    name: 'Accept All Cookies',
  })
  await cookieButton.click({ timeout: 3000, force: true }).catch(() => {})
  await page.context().storageState({ path: storageState as string })

  await browser.close()
}

export default globalSetup
