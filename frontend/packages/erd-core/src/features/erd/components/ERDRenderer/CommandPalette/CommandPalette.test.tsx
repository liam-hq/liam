import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { CommandPalette } from './CommandPalette'

afterEach(() => {
  cleanup()
})

it('displays nothing by default', () => {
  render(<CommandPalette />)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('opens the dialog with typing ⌘K', async () => {
  const user = userEvent.setup()

  render(<CommandPalette />)

  await user.keyboard('{Meta>}k{/Meta}')

  expect(
    screen.getByRole('dialog', { name: 'Command Palette' }),
  ).toBeInTheDocument()
})

it('opens the dialog with typing ctrl+K', async () => {
  const user = userEvent.setup()

  render(<CommandPalette />)

  await user.keyboard('{Control>}k{/Control}')

  expect(
    screen.getByRole('dialog', { name: 'Command Palette' }),
  ).toBeInTheDocument()
})
