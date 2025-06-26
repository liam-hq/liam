import { expect, test } from '@playwright/test'
import { DEFAULT_TEST_URL } from '../../default_test_url'

test.beforeEach(async ({ page, isMobile }) => {
  await page.goto(DEFAULT_TEST_URL)
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden()

  if (isMobile) {
    const openToolbarButton = page.getByTestId('open-toolbar-button')
    await openToolbarButton.click({ force: true })
  }
})

type ShowModeTest = {
  mode: string
  expectedColumns: string[]
}

const showModeTests: ShowModeTest[] = [
  {
    mode: 'Table Name',
    expectedColumns: [],
  },
  {
    mode: 'Key Only',
    expectedColumns: ['idbigserial', 'account_idbigint'],
  },
  {
    mode: 'All Fields',
    expectedColumns: [
      'idbigserial',
      'account_idbigint',
      'titlevarchar',
      'created_attimestamp',
      'updated_attimestamp',
      'replies_policyinteger',
      'exclusiveboolean',
    ],
  },
]
test('should be visible', async ({ page, isMobile }) => {
  const toolbars = page.getByTestId('toolbar')
  const toolbar = isMobile ? toolbars.first() : toolbars.nth(1)
  await expect(toolbar).toBeVisible()
})

test('zoom in button should increase zoom level', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(15000)
  const toolbars = page.getByTestId('toolbar')
  const toolbar = isMobile ? toolbars.first() : toolbars.nth(1)
  const zoomLevelText = toolbar.getByLabel('Zoom level')

  const zoomLevelBefore = await zoomLevelText.textContent()

  const zoomInButton = toolbar.getByTestId('toolbar-icon-button-Zoom in')
  await zoomInButton.click()

  await expect(zoomLevelText).not.toHaveText(zoomLevelBefore)

  const zoomLevelAfter = await zoomLevelText.textContent()
  expect(Number.parseInt(zoomLevelBefore)).toBeLessThan(
    Number.parseInt(zoomLevelAfter),
  )
})

test('zoom out button should decrease zoom level', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(15000)
  const toolbars = page.getByTestId('toolbar')
  const toolbar = isMobile ? toolbars.first() : toolbars.nth(1)

  // Make sure to increase the zoom level beforehand
  const zoomInButton = toolbar.getByTestId('toolbar-icon-button-Zoom in')
  await zoomInButton.click()

  const zoomLevelText = toolbar.getByLabel('Zoom level')

  const zoomLevelBefore = await zoomLevelText.textContent()

  const zoomOutButton = toolbar.getByTestId('toolbar-icon-button-Zoom out')
  await zoomOutButton.click()

  await expect(zoomLevelText).not.toHaveText(zoomLevelBefore)

  const zoomLevelAfter = await zoomLevelText.textContent()
  expect(Number.parseInt(zoomLevelBefore)).toBeGreaterThan(
    Number.parseInt(zoomLevelAfter),
  )
})

test('tidyup button should make the table nodes tidy', async ({
  page,
  isMobile,
}) => {
  // skip because can't move the table node on mobile by mouse
  if (isMobile) test.skip()

  const toolbars = page.getByTestId('toolbar')
  const toolbar = isMobile ? toolbars.first() : toolbars.nth(1)
  const tidyUpButton = toolbar.getByTestId('toolbar-icon-button-Tidy up')

  const tableNode = page.getByTestId('rf__node-accounts')

  const initialTableNodePosition = await tableNode.boundingBox()

  await page.mouse.move(
    initialTableNodePosition.x + initialTableNodePosition.width / 2,
    initialTableNodePosition.y + initialTableNodePosition.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    initialTableNodePosition.x + 500,
    initialTableNodePosition.y + 500,
    { steps: 50 },
  )
  await page.mouse.up()
  await page.waitForTimeout(500)

  const movedTableNodePosition = await tableNode.boundingBox()

  expect(
    Math.abs(movedTableNodePosition.x - initialTableNodePosition.x),
  ).toBeGreaterThan(100)
  expect(
    Math.abs(movedTableNodePosition.y - initialTableNodePosition.y),
  ).toBeGreaterThan(100)

  await tidyUpButton.click()
  await page.waitForTimeout(500)

  const finalTableNodePosition = await tableNode.boundingBox()

  expect(Math.abs(finalTableNodePosition.x - initialTableNodePosition.x)).toBe(
    0,
  )
  expect(Math.abs(finalTableNodePosition.y - initialTableNodePosition.y)).toBe(
    0,
  )
})

test('fitview button should make the table nodes fit the viewport', async ({
  page,
  isMobile,
}) => {
  if (isMobile) test.skip()

  const toolbars = page.getByTestId('toolbar')
  const toolbar = isMobile ? toolbars.first() : toolbars.nth(1)
  const fitViewButton = toolbar.getByTestId('toolbar-icon-button-Zoom to fit')

  const tableNode = page.getByTestId('rf__node-accounts')
  await expect(tableNode).toBeInViewport()

  const zoomInButton = toolbar.getByTestId('toolbar-icon-button-Zoom in')

  // Zoom in to ensure the table is out of viewport
  for (let i = 0; i < 10; i++) {
    await zoomInButton.click()
  }

  await expect(tableNode).not.toBeInViewport()

  await fitViewButton.click()

  await expect(tableNode).toBeInViewport()
})

test.describe('Show Mode', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    if (isMobile) test.skip()

    const showModeButton = page.getByTestId('show-mode')
    await showModeButton.click()
  })

  for (const { mode, expectedColumns } of showModeTests) {
    test(`Show Mode: ${mode}`, async ({ page, isMobile }) => {
      const modeButtonRole = isMobile ? 'radio' : 'menuitemradio'
      const modeButton = page.getByRole(modeButtonRole, {
        name: mode,
      })
      await modeButton.click()

      const tableNode = page.getByRole('button', {
        name: 'lists table',
        exact: true,
      })

      const columns = tableNode.getByRole('listitem')
      await expect(columns).toHaveText(expectedColumns)
    })
  }
})
