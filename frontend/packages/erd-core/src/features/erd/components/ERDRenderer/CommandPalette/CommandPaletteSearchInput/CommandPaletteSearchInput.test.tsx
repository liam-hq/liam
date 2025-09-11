import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Command } from 'cmdk'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommandPaletteSearchInput } from './CommandPaletteSearchInput'

const mockSetMode = vi.fn()

const wrapper = (props: PropsWithChildren) => (
  <Command>{props.children}</Command>
)

afterEach(() => {
  vi.clearAllMocks()
})

describe('in case input mode is "default"', () => {
  describe('when the user pressed > key', () => {
    it('should switch to "command" mode when value is empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'default' }}
          setMode={mockSetMode}
        />,
        { wrapper },
      )
      screen.getByRole('combobox').focus()

      await user.keyboard('>')

      expect(mockSetMode).toHaveBeenCalledWith({ type: 'command' })
    })
  })

  it('should not switch input mode when value is not empty', async () => {
    const user = userEvent.setup()
    render(
      <CommandPaletteSearchInput
        mode={{ type: 'default' }}
        setMode={mockSetMode}
      />,
      { wrapper },
    )
    screen.getByRole('combobox').focus()

    // make the input not empty
    await user.keyboard('hello')

    await user.keyboard('>')

    expect(mockSetMode).not.toHaveBeenCalled()
  })
})

describe('in case input mode is "command"', () => {
  describe('when the user pressed Backspace key', () => {
    it('should switch to "default" mode when value is empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'command' }}
          setMode={mockSetMode}
        />,
        { wrapper },
      )
      screen.getByRole('combobox').focus()

      await user.keyboard('{backspace}')

      expect(mockSetMode).toHaveBeenCalledWith({ type: 'default' })
    })
  })

  it('should not switch input mode when value is not empty', async () => {
    const user = userEvent.setup()
    render(
      <CommandPaletteSearchInput
        mode={{ type: 'command' }}
        setMode={mockSetMode}
      />,
      { wrapper },
    )
    screen.getByRole('combobox').focus()

    // make the input not empty
    await user.keyboard('hello')

    await user.keyboard('{backspace}')

    expect(mockSetMode).not.toHaveBeenCalled()
  })
})
