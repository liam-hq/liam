import { aTable } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '../../../../../../stores'
import * as UseTableSelection from '../../../../hooks'
import { CommandPaletteProvider } from '../CommandPaletteProvider'
import * as UseCommandPalette from '../CommandPaletteProvider/hooks'
import { TableOptions } from './TableOptions'

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
      users: aTable({ name: 'users' }),
      posts: aTable({ name: 'posts' }),
      follows: aTable({ name: 'follows' }),
      user_settings: aTable({ name: 'user_settings' }),
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

it('displays table options', () => {
  render(<TableOptions suggestion={null} />, { wrapper })

  // FIXME: their roles should be "link" rather than "option". Also we would like to check its href attribute
  expect(screen.getByRole('link', { name: 'users' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'posts' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'follows' })).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'user_settings' }),
  ).toBeInTheDocument()
})

describe('mouse interactions', () => {
  it('moves to clicked table in ERD and closes the dialog', async () => {
    render(<TableOptions suggestion={null} />, { wrapper })
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'follows' }))

    expect(mockSelectTable).toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).toHaveBeenCalledWith(false)
  })

  it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
    render(<TableOptions suggestion={null} />, { wrapper })
    const user = userEvent.setup()

    await user.keyboard('{Meta>}')
    await user.click(screen.getByRole('link', { name: 'follows' }))
    await user.keyboard('{/Meta}')

    expect(mockSelectTable).not.toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
  })
})

describe('keyboard interactions', () => {
  it('moves to suggested table in ERD and closes the dialog on Enter', async () => {
    render(<TableOptions suggestion={{ type: 'table', name: 'users' }} />, {
      wrapper,
    })
    const user = userEvent.setup()

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
    render(<TableOptions suggestion={{ type: 'table', name: 'users' }} />, {
      wrapper,
    })
    const user = userEvent.setup()

    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(mockWindowOpen).toHaveBeenCalledWith('?active=users')

    // other functions are not called
    expect(mockSelectTable).not.toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
  })

  it('does nothing on Enter when suggestion is not table', async () => {
    render(
      <TableOptions suggestion={{ type: 'command', name: 'copy link' }} />,
      { wrapper },
    )
    const user = userEvent.setup()

    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(mockWindowOpen).not.toHaveBeenCalled()
    expect(mockSelectTable).not.toHaveBeenCalled()
    expect(mockSetCommandPaletteDialogOpen).not.toHaveBeenCalled()
  })
})
