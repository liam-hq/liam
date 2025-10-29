import { aColumn, anIndex, aTable } from '@liam-hq/schema'
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
import type { CommandPaletteSuggestion } from '../types'
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
        indexes: {
          users_on_status_id: anIndex({ name: 'users_on_status_id' }),
          users_on_created_at: anIndex({ name: 'users_on_created_at' }),
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
  expect(within(userTableOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users',
  )

  // column options
  const idColumnOption = screen.getByRole('option', { name: 'id' })
  expect(within(idColumnOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users#users__columns__id',
  )
  const createdAtColumnOption = screen.getByRole('option', {
    name: 'created_at',
  })
  expect(within(createdAtColumnOption).getByRole('link')).toHaveAttribute(
    'href',
    '?active=users#users__columns__created_at',
  )

  // index options
  const usersOnStatusIdIndexColumnOption = screen.getByRole('option', {
    name: 'users_on_status_id',
  })
  expect(
    within(usersOnStatusIdIndexColumnOption).getByRole('link'),
  ).toHaveAttribute('href', '?active=users#users__indexes__users_on_status_id')
  const usersOnCreatedAtIndexColumnOption = screen.getByRole('option', {
    name: 'users_on_created_at',
  })
  expect(
    within(usersOnCreatedAtIndexColumnOption).getByRole('link'),
  ).toHaveAttribute('href', '?active=users#users__indexes__users_on_created_at')

  // other tables are not displayed
  expect(screen.queryByRole('link', { name: 'posts' })).not.toBeInTheDocument()
})

describe('mouse interactions', () => {
  describe.each<{ kind: string; elementName: string; hash: string }>([
    { kind: 'table', elementName: 'users', hash: '' },
    {
      kind: 'column',
      elementName: 'created_at',
      hash: '#users__columns__created_at',
    },
    {
      kind: 'index',
      elementName: 'users_on_status_id',
      hash: '#users__indexes__users_on_status_id',
    },
  ])('$kind option', ({ elementName, hash }) => {
    it('moves to clicked option in ERD and closes the dialog', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.click(screen.getByRole('link', { name: elementName }))

      expect(mockSelectTable).toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
      expect(window.location.hash).toBe(hash)
    })

    it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={null} />, {
        wrapper,
      })

      await user.keyboard('{Meta>}')
      await user.click(screen.getByRole('link', { name: elementName }))
      await user.keyboard('{/Meta}')

      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()

      // FIXME: jsdom doesn't implement behavior of ⌘ + click to open a link in a new tab, but it changes the URL of the current window
      // So, the following assertion should pass but doesn't
      // expect(window.location.hash).toBe('')
    })
  })
})

describe('keyboard interactions', () => {
  describe.each<{
    kind: string
    suggestion: CommandPaletteSuggestion
    hash: string
  }>([
    {
      kind: 'table',
      suggestion: { type: 'table', name: 'users' },
      hash: '',
    },
    {
      kind: 'column',
      suggestion: {
        type: 'column',
        tableName: 'users',
        columnName: 'created_at',
      },
      hash: '#users__columns__created_at',
    },
    {
      kind: 'index',
      suggestion: {
        type: 'index',
        tableName: 'users',
        indexName: 'users_on_status_id',
      },
      hash: '#users__indexes__users_on_status_id',
    },
  ])('$kind option', ({ suggestion, hash }) => {
    it('moves to suggested option in ERD and closes the dialog on Enter', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={suggestion} />, {
        wrapper,
      })

      await user.keyboard('{Enter}')

      expect(mockSelectTable).toHaveBeenCalledWith({
        displayArea: 'main',
        tableId: 'users',
      })
      expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
      expect(window.location.hash).toBe(hash)

      // other functions are not called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it('opens suggested element in another tab on ⌘Enter', async () => {
      const user = userEvent.setup()
      render(<TableDetailOptions tableName="users" suggestion={suggestion} />, {
        wrapper,
      })

      await user.keyboard('{Meta>}{Enter}{/Meta}')

      expect(mockWindowOpen).toHaveBeenCalledWith(`?active=users${hash}`)

      // other functions are not called
      expect(mockSelectTable).not.toHaveBeenCalled()
      expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
    })
  })

  it('does nothing on Enter when suggestion is neither table, column nor index', async () => {
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
