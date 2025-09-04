import { expect, test } from '@playwright/test'
import { DEFAULT_TEST_URL } from '../../defaultTestUrl'

test('Page has title', async ({ page }) => {
  await page.goto(DEFAULT_TEST_URL)
  await expect(page).toHaveTitle(/Liam ERD/)
})

test('Copy link button copies current URL to clipboard', async ({
  page,
  isMobile,
}) => {
  if (isMobile) test.skip()

  await page.goto(DEFAULT_TEST_URL)

  const copyButton = page.getByTestId('copy-link')
  await copyButton.click()

  const clipboardContent = await page.evaluate(() =>
    navigator.clipboard.readText(),
  )
  expect(clipboardContent).toBe(page.url())
})

test('Table node should be highlighted when clicked', async ({ page }) => {
  await page.goto(DEFAULT_TEST_URL)

  const tableNode = page.getByTestId('rf__node-accounts').first()

  await tableNode.click()

  const highlighted = tableNode.locator('[data-erd="table-node-highlighted"]')
  await expect(highlighted).toBeVisible()
})

test('Edge animation should be triggered when table node is clicked', async ({
  page,
}) => {
  await page.goto(DEFAULT_TEST_URL)

  const tableNode = page.getByTestId('rf__node-account_aliases')

  const edge = page.getByRole('img', {
    name: 'Edge from accounts to account_aliases',
  })

  const edgeEllipseBefore = edge.locator('ellipse').first()
  await expect(edgeEllipseBefore).toBeHidden()

  await tableNode.click()

  const edgeEllipseAfter = edge.locator('ellipse').first()
  await expect(edgeEllipseAfter).toBeVisible()
})

test('Cardinality should be highlighted when table node is clicked', async ({
  page,
}) => {
  await page.goto(DEFAULT_TEST_URL)

  const tableNode = page.getByTestId('rf__node-account_aliases')

  const edge = page.getByRole('img', {
    name: 'Edge from accounts to account_aliases',
  })

  const cardinalityBefore = edge.locator('path').first()

  // Check that marker attributes exist and contain URL patterns (dynamic IDs)
  const markerStartBefore = await cardinalityBefore.getAttribute('marker-start')
  const markerEndBefore = await cardinalityBefore.getAttribute('marker-end')

  expect(markerStartBefore).toMatch(/^url\(#.*\)$/)
  expect(markerEndBefore).toMatch(/^url\(#.*\)$/)

  await tableNode.click()

  const cardinalityAfter = edge.locator('path').first()

  // Check that marker attributes change to highlight versions (should be different IDs)
  const markerStartAfter = await cardinalityAfter.getAttribute('marker-start')
  const markerEndAfter = await cardinalityAfter.getAttribute('marker-end')

  expect(markerStartAfter).toMatch(/^url\(#.*\)$/)
  expect(markerEndAfter).toMatch(/^url\(#.*\)$/)

  // Verify that the marker IDs changed (highlighting effect)
  expect(markerStartAfter).not.toBe(markerStartBefore)
  expect(markerEndAfter).not.toBe(markerEndBefore)
})
