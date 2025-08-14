import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Command } from 'cmdk'
import { describe, expect, it } from 'vitest'
import { CommandPaletteSearchInput } from './CommandPaletteSearchInput'

const wrapper = ({ children }: React.PropsWithChildren) => (
  <Command>{children}</Command>
)

describe('displays a suggestion to complete the input', () => {
  it('when the input matches the beginning of a suggestion, display the remaining text.', async () => {
    const user = userEvent.setup()

    render(<CommandPaletteSearchInput suggestion="user-settings" />, {
      wrapper,
    })
    await user.type(screen.getByRole('combobox'), 'user')

    expect(
      screen.getByTestId('command-palette-search-input-suggestion-suffix'),
    ).toHaveTextContent(/^-settings$/)
  })

  it('when the input does not match the beginning of a suggestion, display the whole text.', async () => {
    const user = userEvent.setup()

    render(<CommandPaletteSearchInput suggestion="user-settings" />, {
      wrapper,
    })
    await user.type(screen.getByRole('combobox'), 'uzer')

    expect(
      screen.getByTestId('command-palette-search-input-suggestion-suffix'),
    ).toHaveTextContent(/^- user-settings$/)
  })
})
