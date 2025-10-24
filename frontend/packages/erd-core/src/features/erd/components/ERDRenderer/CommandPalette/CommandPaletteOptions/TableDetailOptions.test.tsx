import { aColumn, aTable } from '@liam-hq/schema'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '../../../../../../stores'
import * as UseTableSelection from '../../../../hooks'
import { CommandPaletteProvider } from '../CommandPaletteProvider'
import * as UseCommandPalette from '../CommandPaletteProvider/hooks'
import { TableDetailOptions } from './TableDetailOptions'

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

const schema: SchemaProviderValue = {
  current: {
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({ name: 'id' }),
          created_at: aColumn({ name: 'created_at', type: 'timestamp' }),
        },
      }),
      posts: aTable({ name: 'posts' }),
    },
    enums: {},
    extensions: {},
  },
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter>
    <ReactFlowProvider>
      <UserEditingProvider>
        <SchemaProvider {...schema}>
          <CommandPaletteProvider>
            <Command>{children}</Command>
          </CommandPaletteProvider>
        </SchemaProvider>
      </UserEditingProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

it('displays selected table option and its columns', () => {
  render(<TableDetailOptions tableName="users" suggestion={null} />, {
    wrapper,
  })

  // table option
  const userTableOption = screen.getByRole('option', { name: 'users' })
  expect(userTableOption).toBeInTheDocument()
  expect(within(userTableOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users',
  )

  // column options
  const idColumnOption = screen.getByRole('option', { name: 'id' })
  expect(idColumnOption).toBeInTheDocument()
  expect(within(idColumnOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users#users__columns__id',
  )
  const createdAtColumnOption = screen.getByRole('option', {
    name: 'created_at',
  })
  expect(createdAtColumnOption).toBeInTheDocument()
  expect(within(createdAtColumnOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users#users__columns__created_at',
  )

  // other tables are not displayed
  expect(screen.queryByRole('link', { name: 'posts' })).not.toBeInTheDocument()
})

describe('mouse interactions', () => {
  describe('table option', () => {
    it('moves to clicked table in ERD and closes the dialog', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.click(screen.getByRole('link', { name: 'users' }))

      expect(mockSelectTable).toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
    })

    it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.keyboard('{Meta>}')
      await user.click(screen.getByRole('link', { name: 'users' }))
      await user.keyboard('{/Meta}')

      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  describe('column options', () => {
    it('moves to clicked table column in ERD and closes the dialog', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.click(screen.getByRole('link', { name: 'created_at' }))

      expect(mockSelectTable).toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
      expect(window.location.hash).toBe('#users__columns__created_at')
    })

    it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.keyboard('{Meta>}')
      await user.click(screen.getByRole('link', { name: 'created_at' }))
      await user.keyboard('{/Meta}')

      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()

      // FIXME: jsdom doesn't implement behavior of ⌘ + click to open a link in a new tab, but it changes the URL of the current window
      // So, the following assertion doesn't pass
      // expect(window.location.hash).toBe('')
    })
  })
})

describe('keyboard interactions', () => {
  describe('table option', () => {
    it('moves to suggested table in ERD and closes the dialog on Enter', async () => {
      const user = userEvent.setup()
      render(
        <TableDetailOptions
          tableName="users"
          suggestion={{ type: 'table', name: 'users' }}
        />,
        { wrapper },
      )

      await user.keyboard('{Enter}')

      expect(mockSelectTable).toHaveBeenCalledWith({
        displayArea: 'main',
        tableId: 'users',
      })
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
      expect(window.location.hash).toBe('')

      // other functions are not called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens suggested table in another tab on ⌘Enter', async () => {
      const user = userEvent.setup()
      render(
        <TableDetailOptions
          tableName="users"
          suggestion={{ type: 'table', name: 'users' }}
        />,
        { wrapper },
      )

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockWindowOpen).toHaveBeenCalledWith('?active=users')

      // other functions are not called
      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  describe('column option', () => {
    it('moves to suggested table column in ERD and closes the dialog on Enter', async () => {
      const user = userEvent.setup()
      render(
        <TableDetailOptions
          tableName="users"
          suggestion={{
            type: 'column',
            tableName: 'users',
            columnName: 'created_at',
          }}
        />,
        { wrapper },
      )

      await user.keyboard('{Enter}')

      expect(mockSelectTable).toHaveBeenCalledWith({
        displayArea: 'main',
        tableId: 'users',
      })
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
      expect(window.location.hash).toBe('#users__columns__created_at')

      // other functions are not called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens suggested table column in another tab on ⌘Enter', async () => {
      const user = userEvent.setup()
      render(
        <TableDetailOptions
          tableName="users"
          suggestion={{
            type: 'column',
            tableName: 'users',
            columnName: 'created_at',
          }}
        />,
        { wrapper },
      )

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '?active=users#users__columns__created_at',
      )

      // other functions are not called
      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  it('does nothing on Enter when suggestion is not table', async () => {
    const user = userEvent.setup()
    render(
      <TableDetailOptions
        tableName="users"
        suggestion={{ type: 'command', name: 'copy link' }}
      />,
      { wrapper },
    )

    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(mockWindowOpen).not.toHaveBeenCalled()
    expect(mockSelectTable).not.toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
  })
})
