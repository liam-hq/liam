import { expect, test } from '@playwright/test'
import { DEFAULT_TEST_URL } from '../../defaultTestUrl'

test.beforeEach(async ({ page, isMobile }) => {
  if (isMobile) {
    test.skip()
  }

  await page.goto(DEFAULT_TEST_URL)
})

test('go to table in ERD by CommandPalette', async ({ page }) => {
  // Open dialog
  await page.keyboard.press('Control+k')
  const commandPaletteDialog = await page.getByRole('dialog', {
    name: 'Command Palette',
  })
  await expect(commandPaletteDialog).toBeVisible()

  // Select "user_roles" option
  await page.keyboard.type('user_roles')
  await page.keyboard.press('Enter')

  // Close dialog and go to ERD
  await expect(commandPaletteDialog).not.toBeVisible()
  await expect(page).toHaveURL(/.*active=user_roles/)
})
