import { aTable } from '@liam-hq/db-structure'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NuqsAdapter } from 'nuqs/adapters/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaProvider, UserEditingProvider } from '@/stores'
import type { SchemaStore } from '@/stores/schema/schema'
import { CommandPalette } from './CommandPalette'

afterEach(() => {
  cleanup()
})

const schema: SchemaStore = {
  current: {
    tables: {
      users: aTable({ name: 'users' }),
      posts: aTable({ name: 'posts' }),
      follows: aTable({ name: 'follows' }),
      user_settings: aTable({ name: 'user_settings' }),
    },
    tableGroups: {},
    relationships: {},
  },
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsAdapter>
    <UserEditingProvider>
      <SchemaProvider schema={schema}>{children}</SchemaProvider>
    </UserEditingProvider>
  </NuqsAdapter>
)

const prepareCommandPalette = async () => {
  const user = userEvent.setup()

  render(<CommandPalette />, { wrapper })

  await user.keyboard('{Meta>}k{/Meta}')
  const dialog = await screen.findByRole('dialog', {
    name: 'Command Palette',
  })
  const searchCombobox = within(dialog).getByRole('combobox')
  const preview = within(dialog).getByTestId('CommandPalettePreview')

  return { user, elements: { dialog, searchCombobox, preview } }
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
})

describe('options and combobox interactions', () => {
  it('renders options with table name', async () => {
    const {
      elements: { dialog },
    } = await prepareCommandPalette()

    expect(within(dialog).getAllByRole('option')).toHaveLength(4)
    expect(within(dialog).getByRole('option', { name: 'users' }))
    expect(within(dialog).getByRole('option', { name: 'posts' }))
    expect(within(dialog).getByRole('option', { name: 'follows' }))
    expect(within(dialog).getByRole('option', { name: 'user_settings' }))
  })

  it('filters options based on user input in the combobox', async () => {
    const {
      user,
      elements: { dialog, searchCombobox },
    } = await prepareCommandPalette()

    expect(searchCombobox).toHaveFocus()

    await user.keyboard('user')

    expect(within(dialog).getAllByRole('option')).toHaveLength(2)
    expect(within(dialog).getByRole('option', { name: 'users' }))
    expect(within(dialog).getByRole('option', { name: 'user_settings' }))
  })

  it('renders "No results found." if user input does not match any options', async () => {
    const {
      user,
      elements: { dialog, searchCombobox },
    } = await prepareCommandPalette()

    expect(searchCombobox).toHaveFocus()

    await user.keyboard('HelloWorld')

    expect(within(dialog).queryByRole('option')).not.toBeInTheDocument()
    expect(within(dialog).getByText('No results found.')).toBeInTheDocument()
  })
})

describe('preview with option interactions', () => {
  it('displays a preview of the option hovered', async () => {
    const {
      user,
      elements: { dialog, preview },
    } = await prepareCommandPalette()

    expect(within(preview).getByText('users')).toBeInTheDocument()

    await user.hover(within(dialog).getByRole('option', { name: 'follows' }))

    expect(within(preview).getByText('follows')).toBeInTheDocument()
  })

  it('displays a preview of the option selected via arrow key navigation', async () => {
    const {
      user,
      elements: { preview },
    } = await prepareCommandPalette()

    expect(within(preview).getByText('users')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(within(preview).getByText('posts')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(within(preview).getByText('follows')).toBeInTheDocument()

    await user.keyboard('{ArrowUp}')
    expect(within(preview).getByText('posts')).toBeInTheDocument()
  })
})
