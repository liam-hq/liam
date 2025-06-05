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

  const copyButton = page.getByRole('button', { name: 'Copy Link' })
  await copyButton.click()

  const clipboardContent = await page.evaluate(() =>
    navigator.clipboard.readText(),
  )
  expect(clipboardContent).toBe(page.url())
})

test('Table node should be highlighted when clicked', async ({ page }) => {
  await page.goto('/')

  const tableNode = page.getByRole('button', {
    name: 'accounts table',
    exact: true,
  })

  await tableNode.click()

  await expect(
    tableNode.locator('div[class^="TableNode_wrapper"]'),
  ).toHaveAttribute('data-erd', 'table-node-highlighted')
})

test('Edge animation should be triggered when table node is clicked', async ({
  page,
}) => {
  await page.goto('/')

  const tableNode = page.getByRole('button', {
    name: 'account_aliases table',
    exact: true,
  })

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
  await page.goto('/')

  const tableNode = page.getByRole('button', {
    name: 'account_aliases table',
    exact: true,
  })

  const edge = page.getByRole('img', {
    name: 'Edge from accounts to account_aliases',
  })

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

  const cardinalityAfter = edge.locator('path').first()
  await expect(cardinalityAfter).toHaveAttribute(
    'marker-start',
    'url(#zeroOrOneRightHighlight)',
  )
  await expect(cardinalityAfter).toHaveAttribute(
    'marker-end',
    'url(#zeroOrManyLeftHighlight)',
  )
})
