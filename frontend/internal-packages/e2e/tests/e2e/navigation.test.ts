import { expect, type Page, test } from '@playwright/test'
import { DEFAULT_TEST_URL } from '../../defaultTestUrl'

const expectUserTableColumnInAccountsTableVisibility = async (
  page: Page,
  visibility: 'visible' | 'hidden',
) => {
  const accountsTable = page.getByTestId('rf__node-accounts')
  const userNameColumn = accountsTable.getByText('username')

  if (visibility === 'visible') {
    await expect(userNameColumn).toBeVisible()
  } else {
    await expect(userNameColumn).not.toBeVisible()
  }
}

test.describe('Navigation and URL Parameters', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // TODO: Implement this test on mobile
    if (isMobile) {
      test.skip()
    }

    await page.goto(DEFAULT_TEST_URL, { waitUntil: 'domcontentloaded' })
  })

  test.describe('Browser History', () => {
    test('should handle back/forward navigation with showMode changes', async ({
      page,
    }) => {
      // Initial state
      const showModeButton = page.getByTestId('show-mode')

      // Change to ALL_FIELDS
      await showModeButton.click()
      const tableNameOption = page.getByRole('menuitemradio', {
        name: 'All Fields',
      })
      await tableNameOption.click()
      await expect(page).toHaveURL(/.*showMode=ALL_FIELDS/)

      // Change to KEY_ONLY
      await showModeButton.click()
      const keyOnlyOption = page.getByRole('menuitemradio', {
        name: 'Key Only',
      })
      await keyOnlyOption.click()
      await expect(page).toHaveURL(/.*showMode=KEY_ONLY/)
      await expectUserTableColumnInAccountsTableVisibility(page, 'hidden')

      // Go back
      await page.goBack()
      await expect(page).toHaveURL(/.*showMode=ALL_FIELDS/)
      await expectUserTableColumnInAccountsTableVisibility(page, 'visible')

      // Go forward
      await page.goForward()
      await expect(page).toHaveURL(/.*showMode=KEY_ONLY/)
      await expectUserTableColumnInAccountsTableVisibility(page, 'hidden')
    })

    test('should handle back/forward navigation with table selection', async ({
      page,
    }) => {
      // Initial state - select accounts table
      const accountsTable = page.getByTestId('rf__node-accounts').first()
      await accountsTable.click()

      await expect(page).toHaveURL(/.*active=accounts/)
      const highlighted = accountsTable.locator(
        '[data-erd="table-node-highlighted"]',
      )
      await expect(highlighted).toBeVisible()

      // Select users table
      const usersTable = page.getByTestId('rf__node-users').first()
      await usersTable.click()
      await expect(page).toHaveURL(/.*active=users/)

      // Go back to accounts table selection
      await page.goBack()
      await expect(page).toHaveURL(/.*active=accounts/)

      // Go forward to users table selection
      await page.goForward()
      await expect(page).toHaveURL(/.*active=users/)
    })

    // FIXME: Browser back on hidden table is not working properly
    test('should handle back/forward navigation with table hiding', async ({
      page,
    }) => {
      // Initial state
      const accountsTable = page.getByTestId('rf__node-accounts').first()
      await expect(accountsTable).toBeVisible()

      // Hide the accounts table
      await page.getByTestId('toggle-sidebar-icon-button').click()
      await page
        .getByTestId('table-name-menu-button-accounts')
        .getByLabel('Hide Table')
        .click()
      await expect(page).toHaveURL(/.*hidden=eJxLTE7OL80rKQYADrsDYQ/)
      await expect(accountsTable).not.toBeVisible()

      // Go back to initial state
      await page.goBack()
      await expect(accountsTable).toBeVisible()
      await expect(page).not.toHaveURL(/.*hidden=/)

      // Go forward to hidden state
      await page.goForward()
      await expect(page).toHaveURL(/.*hidden=eJxLTE7OL80rKQYADrsDYQ/)
      await expect(accountsTable).not.toBeVisible()
    })
  })
})
