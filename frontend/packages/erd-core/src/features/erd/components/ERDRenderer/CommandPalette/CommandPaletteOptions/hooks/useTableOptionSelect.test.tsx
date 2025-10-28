import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, ReactNode } from 'react'
import type { Hash } from 'src/schemas'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UserEditingProvider } from '../../../../../../../stores'
import * as UseTableSelection from '../../../../../hooks'
import { CommandPaletteProvider } from '../../CommandPaletteProvider'
import * as UseCommandPalette from '../../CommandPaletteProvider/hooks'
import type { CommandPaletteSuggestion } from '../../types'
import { useTableOptionSelect } from './useTableOptionSelect'

beforeEach(() => {
  window.location.hash = ''
})

afterEach(() => {
  vi.clearAllMocks()
})

const mockSetCommandPaletteDialogOpen = vi.fn()
const mockSelectTable = vi.fn()
const mockWindowOpen = vi.fn()

const originalUseCommandPaletteOrThrow =
  UseCommandPalette.useCommandPaletteOrThrow
vi.spyOn(UseCommandPalette, 'useCommandPaletteOrThrow').mockImplementation(
  () => {
    const original = originalUseCommandPaletteOrThrow()
    return {
      ...original,
      setOpen: mockSetCommandPaletteDialogOpen,
    }
  },
)
const originalUseTableSelection = UseTableSelection.useTableSelection
vi.spyOn(UseTableSelection, 'useTableSelection').mockImplementation(() => {
  const original = originalUseTableSelection()
  return {
    ...original,
    selectTable: mockSelectTable,
  }
})
vi.spyOn(window, 'open').mockImplementation(mockWindowOpen)

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter>
    <ReactFlowProvider>
      <UserEditingProvider>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </UserEditingProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

describe('keyboard interactions', () => {
  describe('when suggestion is a table', () => {
    it('moves to suggested table in ERD and closes the dialog on Enter', async () => {
      const user = userEvent.setup()
      renderHook(() => useTableOptionSelect({ type: 'table', name: 'users' }), {
        wrapper,
      })

      await user.keyboard('{Enter}')

      expect(mockSelectTable).toHaveBeenCalledWith({
        displayArea: 'main',
        tableId: 'users',
      })
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)

      // other functions are not called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens suggested table in another tab on ⌘Enter', async () => {
      const user = userEvent.setup()
      renderHook(() => useTableOptionSelect({ type: 'table', name: 'users' }), {
        wrapper,
      })

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockWindowOpen).toHaveBeenCalledWith('?active=users')

      // other functions are not called
      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  describe('when suggestion is a column', () => {
    it('moves to suggested table column in ERD and closes the dialog on Enter', async () => {
      const user = userEvent.setup()
      renderHook(
        () =>
          useTableOptionSelect({
            type: 'column',
            tableName: 'users',
            columnName: 'name',
          }),
        { wrapper },
      )

      await user.keyboard('{Enter}')

      expect(mockSelectTable).toHaveBeenCalledWith({
        displayArea: 'main',
        tableId: 'users',
      })
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)

      // other functions are not called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens suggested table in another tab on ⌘Enter', async () => {
      const user = userEvent.setup()
      renderHook(
        () =>
          useTableOptionSelect({
            type: 'column',
            tableName: 'users',
            columnName: 'name',
          }),
        { wrapper },
      )

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '?active=users#users__columns__name',
      )

      // other functions are not called
      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  describe.each<CommandPaletteSuggestion | null>([
    { type: 'command', name: 'copy link' },
    null,
  ])('when suggestion is other than tables, suggestion = %o', (suggestion) => {
    it('does nothing when on Enter', async () => {
      const user = userEvent.setup()
      renderHook(() => useTableOptionSelect(suggestion), { wrapper })

      await user.keyboard('{Enter}')

      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('does nothing when on ⌘Enter', async () => {
      const user = userEvent.setup()
      renderHook(() => useTableOptionSelect(suggestion), { wrapper })

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })
})

describe('optionSelectHandler', () => {
  // a component for testing the "optionSelectHandler" method of the hook
  // in the test cases, we simulate the method clicking a link of a table option
  const TableOptionLinkWithSelectHandler: FC<{
    tableName: string
    columnElementId: Hash
  }> = ({ tableName, columnElementId }) => {
    const { optionSelectHandler } = useTableOptionSelect(null)

    return (
      <a
        href="/"
        // use the handler by passing the event object and table name
        onClick={(event) =>
          optionSelectHandler(event, tableName, columnElementId)
        }
      >
        table option link
      </a>
    )
  }

  it('moves to clicked table in ERD and closes the dialog', async () => {
    const user = userEvent.setup()
    render(
      <TableOptionLinkWithSelectHandler
        tableName="follows"
        columnElementId="follows__columns__user_id"
      />,
      { wrapper },
    )

    await user.click(screen.getByRole('link', { name: 'table option link' }))

    expect(mockSelectTable).toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
    expect(window.location.hash).toBe('#follows__columns__user_id')
  })

  it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
    const user = userEvent.setup()
    render(
      <TableOptionLinkWithSelectHandler
        tableName="follows"
        columnElementId="follows__columns__user_id"
      />,
      { wrapper },
    )

    await user.keyboard('{Meta>}')
    await user.click(screen.getByRole('link', { name: 'table option link' }))
    await user.keyboard('{/Meta}')

    expect(mockSelectTable).not.toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
  })
})
