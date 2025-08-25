import { aTable } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as UseTableSelection from '@/features/erd/hooks'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '@/stores'
import { CommandPaletteProvider } from '../CommandPaletteProvider'
import { TableOptions } from './TableOptions'

afterEach(() => {
  vi.clearAllMocks()
})

const mockSelectTable = vi.fn()
const mockWindowOpen = vi.fn()

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
  expect(screen.getByRole('option', { name: 'users' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'posts' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'follows' })).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'user_settings' }),
  ).toBeInTheDocument()
})

describe('mouse interactions', () => {
  it('moves to clicked table in ERD and closes the dialog', async () => {
    render(<TableOptions suggestion={null} />, { wrapper })
    const user = userEvent.setup()

    await user.click(screen.getByRole('option', { name: 'follows' }))

    expect(mockSelectTable).toHaveBeenCalled()
    // TODO: check if the dialog is closed
  })

  it('does nothing with ⌘ + click (default browser action: open in new tab)', async () => {
    render(<TableOptions suggestion={null} />, { wrapper })
    const user = userEvent.setup()

    await user.keyboard('{Meta>}')
    await user.click(screen.getByRole('option', { name: 'follows' }))
    await user.keyboard('{/Meta}')

    expect(mockSelectTable).not.toHaveBeenCalled()
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
    // TODO: check if the dialog is closed

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
    // TODO: check if the dialog is NOT closed
  })
})
