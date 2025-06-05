import { type Page, expect, test } from '@playwright/test'

const expectUserTableColumnInAccountsTableVisibility = async (
  page: Page,
  visibility: 'visible' | 'hidden',
) => {
  const accountsTable = page.getByRole('button', {
    name: 'accounts table',
    exact: true,
  })
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

    await page.goto('/')
  })

  test.describe('Browser History', () => {
    test('should handle back/forward navigation with showMode changes', async ({
      page,
    }) => {
      // Initial state
      const showModeButton = page.getByRole('button', { name: 'Show Mode' })

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
      const accountsTable = page.getByRole('button', {
        name: 'accounts table',
        exact: true,
      })
      await accountsTable.click()
      await expect(page).toHaveURL(/.*active=accounts/)
      await expect(accountsTable).toBeVisible()

      // Select users table
      const usersTable = page.getByRole('button', {
        name: 'users table',
        exact: true,
      })
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
      const accountsTable = page.getByRole('button', {
        name: 'accounts table',
        exact: true,
      })
      await expect(accountsTable).toBeVisible()

      // Hide the accounts table
      await page
        .getByRole('button', { name: 'Toggle Sidebar Icon Button' })
        .click()
      await page
        .getByRole('button', { name: 'Menu button for accounts', exact: true })
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
