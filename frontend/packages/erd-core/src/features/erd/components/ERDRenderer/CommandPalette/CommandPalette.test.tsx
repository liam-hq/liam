import { aTable } from '@liam-hq/schema'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '../../../../../stores'
import { CommandPalette } from './CommandPalette'
import { CommandPaletteProvider } from './CommandPaletteProvider'
import { CommandPaletteTriggerButton } from './CommandPaletteTriggerButton'

afterEach(() => {
  cleanup()
})

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
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </SchemaProvider>
      </UserEditingProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

const prepareCommandPalette = async () => {
  const user = userEvent.setup()

  render(<CommandPalette />, { wrapper })

  await user.keyboard('{Meta>}k{/Meta}')
  const dialog = await screen.findByRole('dialog', {
    name: 'Command Palette',
  })

  return {
    user,
    elements: { dialog },
  }
}

it('displays nothing by default', () => {
  render(<CommandPalette />, { wrapper })

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

describe('dialog opening interactions', () => {
  it('opens the dialog with typing ⌘K', async () => {
    const user = userEvent.setup()

    render(<CommandPalette />, { wrapper })

    await user.keyboard('{Meta>}k{/Meta}')

    expect(
      screen.getByRole('dialog', { name: 'Command Palette' }),
    ).toBeInTheDocument()
  })

  it('opens the dialog with typing ctrl+K', async () => {
    const user = userEvent.setup()

    render(<CommandPalette />, { wrapper })

    await user.keyboard('{Control>}k{/Control}')

    expect(
      screen.getByRole('dialog', { name: 'Command Palette' }),
    ).toBeInTheDocument()
  })

  it('opens the dialog with clicking the trigger button', async () => {
    const user = userEvent.setup()

    render(
      <>
        <CommandPaletteTriggerButton />
        <CommandPalette />
      </>,
      { wrapper },
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Open command palette to search features',
      }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Command Palette' }),
    ).toBeInTheDocument()
  })
})

describe('dialog closing interaction', () => {
  it('closes dialog by clicking ESC button', async () => {
    const {
      user,
      elements: { dialog },
    } = await prepareCommandPalette()

    await user.click(within(dialog).getByRole('button', { name: 'ESC' }))

    expect(dialog).not.toBeInTheDocument()
  })
})
