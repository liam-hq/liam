import { type Page, expect, test } from '@playwright/test'

const expectColumnVisibilityInTable = async (
  page: Page,
  tableName: string,
  columnName: string,
  visibility: 'visible' | 'hidden',
) => {
  // Wait for loading state to be hidden
  const loadingStatus = page.getByRole('status', { name: 'Loading' })
  await loadingStatus.waitFor({ state: 'hidden' })

  // Find table and ensure it's ready
  const table = page.getByRole('button', { name: `${tableName} table`, exact: true })
  await table.waitFor({ state: 'attached' })
  await expect(table).toBeVisible()

  // Wait for table content to be stable
  await page.waitForLoadState('domcontentloaded')

  // Find column and check visibility
  const column = table.getByText(columnName, { exact: true })
  await column.waitFor({ state: 'attached' })

  if (visibility === 'visible') {
    await expect(column).toBeVisible()
  } else {
    await expect(column).not.toBeVisible()
  }
}

test.describe('Navigation and URL Parameters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for initial page load
    const loadingStatus = page.getByRole('status', { name: 'Loading' })
    await loadingStatus.waitFor({ state: 'hidden' })
  })

  test.describe('Basic URL Parameters', () => {
    test('showMode changes should be reflected in URL', async ({ page }) => {
      const showModeButton = page.getByRole('button', { name: 'Show Mode' })
      await showModeButton.click()

      const tableNameOption = page.getByRole('menuitemradio', {
        name: 'All Fields',
      })
      await tableNameOption.click()

      await expect(page).toHaveURL(/.*showMode=ALL_FIELDS/)
      await expectColumnVisibilityInTable(
        page,
        'accounts',
        'username',
        'visible',
      )
    })

    test.skip('selecting a table should update active parameter', async () => {})
    test.skip('hiding a table should update hidden parameter', async () => {})
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
      await expectColumnVisibilityInTable(
        page,
        'accounts',
        'username',
        'hidden',
      )

      // Go back
      await page.goBack()
      await expect(page).toHaveURL(/.*showMode=ALL_FIELDS/)
      await expectColumnVisibilityInTable(
        page,
        'accounts',
        'username',
        'visible',
      )

      // Go forward
      await page.goForward()
      await expect(page).toHaveURL(/.*showMode=KEY_ONLY/)
      await expectColumnVisibilityInTable(
        page,
        'accounts',
        'username',
        'hidden',
      )
    })

    test.skip('should handle back/forward navigation with table selection and hiding', async () => {})
  })

  test.describe('Parameter Combinations', () => {
    test.skip('should handle showMode change while table is selected', async () => {})

    test.skip('should handle hiding selected table', async () => {})
  })
})
