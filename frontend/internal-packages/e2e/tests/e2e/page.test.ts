import { expect, test } from '@playwright/test'

test('Page has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Liam ERD/)
})

test('Copy link button copies current URL to clipboard', async ({
  page,
  isMobile,
}) => {
  if (isMobile) test.skip()

  await page.goto('/')

  const copyButton = page.getByTestId('copy-link')
  await copyButton.click()

  const clipboardContent = await page.evaluate(() =>
    navigator.clipboard.readText(),
  )
  expect(clipboardContent).toBe(page.url())
})

test('Table node should be highlighted when clicked', async ({ page }) => {
  await page.goto('/')

  const tableNode = page.getByTestId('rf__node-accounts').first()

  await tableNode.click()
  await page.waitForTimeout(100)

  const highlighted = tableNode.locator('[data-erd="table-node-highlighted"]')
  await expect(highlighted).toBeVisible({ timeout: 10000 })
})

test('Edge animation should be triggered when table node is clicked', async ({
  page,
}) => {
  await page.goto('/')

  const tableNode = page.getByTestId('rf__node-account_aliases')

  const edge = page.getByRole('img', {
    name: 'Edge from accounts to account_aliases',
  })

  const edgeEllipseBefore = edge.locator('ellipse').first()
  await expect(edgeEllipseBefore).toBeHidden()

  await tableNode.click()
  await page.waitForTimeout(100)

  const edgeEllipseAfter = edge.locator('ellipse').first()
  await expect(edgeEllipseAfter).toBeVisible({ timeout: 10000 })
})

test('Cardinality should be highlighted when table node is clicked', async ({
  page,
}) => {
  await page.goto('/')

  const tableNode = page.getByTestId('rf__node-account_aliases')

  const edge = page.getByTestId(
    'rf__edge-accounts_id_to_account_aliases_account_id',
  )

  const cardinalityBefore = edge.locator('path').first()
  await expect(cardinalityBefore).toHaveAttribute(
    'marker-start',
    'url(#zeroOrOneRight)',
  )
  await expect(cardinalityBefore).toHaveAttribute(
    'marker-end',
    'url(#zeroOrManyLeft)',
  )

  await tableNode.click()
  await page.waitForTimeout(100)

  const cardinalityAfter = edge.locator('path').first()
  await expect(cardinalityAfter).toHaveAttribute(
    'marker-start',
    'url(#zeroOrOneRightHighlight)',
    { timeout: 10000 }
  )
  await expect(cardinalityAfter).toHaveAttribute(
    'marker-end',
    'url(#zeroOrManyLeftHighlight)',
    { timeout: 10000 }
  )
})
