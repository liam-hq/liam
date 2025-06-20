import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0]?.use ?? {}
  if (!baseURL || !storageState) {
    throw new Error('baseURL and storageState are required in the config')
  }
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${baseURL}/`)

  const cookieButton = page.getByRole('button', {
    name: 'Accept All Cookies',
  })
  await cookieButton.click({ timeout: 3000, force: true }).catch(() => {})
  await page.context().storageState({ path: storageState as string })

  await browser.close()
}

export default globalSetup
