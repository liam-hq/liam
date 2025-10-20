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
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      await user.keyboard('>')

      expect(mockSetMode).toHaveBeenCalledWith({ type: 'command' })
    })

    it('should not switch input mode when value is not empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'default' }}
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      // make the input not empty
      await user.keyboard('hello')

      await user.keyboard('>')

      expect(mockSetMode).not.toHaveBeenCalled()
    })
  })

  describe('when the user pressed Tab key', () => {
    // TODO: remove this describe block and always activate table mode when releasing the feature
    describe('when table mode is not activatable (default)', () => {
      it('should not switch to "table" mode when a table is suggested', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'default' }}
            suggestion={{ type: 'table', name: 'users' }}
            setMode={mockSetMode}
          />,
          { wrapper },
        )

        await user.keyboard('{Tab}')

        expect(mockSetMode).not.toHaveBeenCalled()
      })
    })

    describe('when table mode is activatable', () => {
      it('should switch to "table" mode and make the input empty when a table is suggested', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'default' }}
            suggestion={{ type: 'table', name: 'users' }}
            setMode={mockSetMode}
            isTableModeActivatable
          />,
          { wrapper },
        )
        const input = screen.getByRole('combobox')

        // make the input not empty
        await user.keyboard('user')

        await user.keyboard('{Tab}')

        expect(mockSetMode).toHaveBeenCalledWith({
          type: 'table',
          tableName: 'users',
        })
        expect(input).toHaveValue('')
      })

      it('should complete input value with suggested text but should not switch the input mode when suggestion is other than "table" option', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'default' }}
            suggestion={{ type: 'command', name: 'Copy Link' }}
            setMode={mockSetMode}
            isTableModeActivatable
          />,
          { wrapper },
        )
        const input = screen.getByRole('combobox')

        await user.keyboard('{Tab}')

        expect(mockSetMode).not.toHaveBeenCalled()
        expect(input).toHaveValue('Copy Link')
      })
    })
  })
})

describe('in case input mode is "command"', () => {
  describe('when the user pressed Backspace key', () => {
    it('should switch to "default" mode when value is empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'command' }}
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      await user.keyboard('{backspace}')

      expect(mockSetMode).toHaveBeenCalledWith({ type: 'default' })
    })

    it('should not switch input mode when value is not empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'command' }}
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      // make the input not empty
      await user.keyboard('hello')

      await user.keyboard('{backspace}')

      expect(mockSetMode).not.toHaveBeenCalled()
    })
  })

  describe('when the user pressed Tab key', () => {
    describe('when table mode is activatable', () => {
      it('should complete input value with suggested text', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'command' }}
            suggestion={{ type: 'command', name: 'Copy Link' }}
            setMode={mockSetMode}
            isTableModeActivatable
          />,
          { wrapper },
        )
        const input = screen.getByRole('combobox')

        await user.keyboard('{Tab}')

        expect(mockSetMode).not.toHaveBeenCalled()
        expect(input).toHaveValue('Copy Link')
      })
    })
  })
})

describe('in case input mode is "table"', () => {
  describe('when the user pressed Backspace key', () => {
    it('should switch to "default" mode when value is empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'table', tableName: 'users' }}
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      await user.keyboard('{backspace}')

      expect(mockSetMode).toHaveBeenCalledWith({ type: 'default' })
    })

    it('should not switch input mode when value is not empty', async () => {
      const user = userEvent.setup()
      render(
        <CommandPaletteSearchInput
          mode={{ type: 'table', tableName: 'users' }}
          suggestion={null}
          setMode={mockSetMode}
        />,
        { wrapper },
      )

      // make the input not empty
      await user.keyboard('hello')

      await user.keyboard('{backspace}')

      expect(mockSetMode).not.toHaveBeenCalled()
    })
  })

  describe('when the user pressed Tab key', () => {
    describe('when table mode is activatable', () => {
      it('should complete input value with suggested text', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'table', tableName: 'user' }}
            suggestion={{
              type: 'column',
              tableName: 'user',
              columnName: 'created_at',
            }}
            setMode={mockSetMode}
            isTableModeActivatable
          />,
          { wrapper },
        )
        const input = screen.getByRole('combobox')

        await user.keyboard('{Tab}')

        expect(mockSetMode).not.toHaveBeenCalled()
        expect(input).toHaveValue('created_at')
      })

      it('should not complete input value when a table is suggested', async () => {
        const user = userEvent.setup()
        render(
          <CommandPaletteSearchInput
            mode={{ type: 'table', tableName: 'user' }}
            suggestion={{ type: 'table', name: 'user' }}
            setMode={mockSetMode}
            isTableModeActivatable
          />,
          { wrapper },
        )
        const input = screen.getByRole('combobox')

        await user.keyboard('{Tab}')

        expect(mockSetMode).not.toHaveBeenCalled()
        expect(input).toHaveValue('')
      })
    })
  })
})

describe('displays a suggestion to complete the input', () => {
  it('displays the remaining text when the input matches the beginning of a suggestion', async () => {
    const user = userEvent.setup()
    render(
      <CommandPaletteSearchInput
        mode={{ type: 'default' }}
        suggestion={{ type: 'table', name: 'user-settings' }}
        setMode={mockSetMode}
        isTableModeActivatable
      />,
      { wrapper },
    )

    await user.type(screen.getByRole('combobox'), 'user-s')

    expect(
      screen.getByTestId('command-palette-search-input-suggestion-suffix'),
    ).toHaveTextContent(/^ettings$/)
  })

  it('display the whole text when the input does not match the beginning of a suggestion', async () => {
    const user = userEvent.setup()
    render(
      <CommandPaletteSearchInput
        mode={{ type: 'default' }}
        suggestion={{ type: 'table', name: 'user-settings' }}
        setMode={mockSetMode}
        isTableModeActivatable
      />,
      { wrapper },
    )

    await user.type(screen.getByRole('combobox'), 'setting')

    expect(
      screen.getByTestId('command-palette-search-input-suggestion-suffix'),
    ).toHaveTextContent(/^- user-settings$/)
  })
})
