import { aTable } from '@liam-hq/schema'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { type FC, type ReactNode, useContext } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '../../../../../stores'
import { UserEditingContext } from '../../../../../stores/userEditing/context'
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

const ActiveTableNameDisplay: FC = () => {
  const userEditing = useContext(UserEditingContext)

  return (
    // The currently active table name is displayed via Context. This component is used in tests for assertions only.
    <div data-testid="test-active-table-name-display">
      {userEditing?.activeTableName}
    </div>
  )
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter>
    <ReactFlowProvider>
      <UserEditingProvider>
        <ActiveTableNameDisplay />
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
  const searchCombobox = within(dialog).getByRole('combobox')
  const preview = within(dialog).getByTestId('CommandPalettePreview')

  const activeTableNameDisplay = screen.getByTestId(
    'test-active-table-name-display',
  )

  return {
    user,
    elements: { dialog, searchCombobox, preview },
    testElements: { activeTableNameDisplay },
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

describe('options and combobox interactions', () => {
  it('renders options with table name', async () => {
    const {
      elements: { dialog },
    } = await prepareCommandPalette()

    expect(within(dialog).getAllByRole('link')).toHaveLength(4)
    expect(within(dialog).getByRole('link', { name: 'users' }))
    expect(within(dialog).getByRole('link', { name: 'posts' }))
    expect(within(dialog).getByRole('link', { name: 'follows' }))
    expect(within(dialog).getByRole('link', { name: 'user_settings' }))
  })

  it('filters options based on user input in the combobox', async () => {
    const {
      user,
      elements: { dialog, searchCombobox },
    } = await prepareCommandPalette()

    expect(searchCombobox).toHaveFocus()

    await user.keyboard('user')

    expect(within(dialog).getAllByRole('link')).toHaveLength(2)
    expect(within(dialog).getByRole('link', { name: 'users' }))
    expect(within(dialog).getByRole('link', { name: 'user_settings' }))
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

    await user.hover(within(dialog).getByRole('link', { name: 'follows' }))

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

describe('go to ERD with option select', () => {
  it('go to the table of clicked option and close dialog', async () => {
    const {
      user,
      elements: { dialog },
      testElements: { activeTableNameDisplay },
    } = await prepareCommandPalette()

    expect(activeTableNameDisplay).toBeEmptyDOMElement()

    const followsOption = within(dialog).getByRole('link', { name: 'follows' })
    const firstChild = followsOption.firstChild
    if (firstChild && firstChild instanceof Element) {
      await user.click(firstChild)
    } else {
      await user.click(followsOption)
    }

    expect(dialog).not.toBeInTheDocument()
    expect(activeTableNameDisplay).toHaveTextContent(/^follows$/)
  })

  it('go to the table of selected option by typing Enter key and close dialog', async () => {
    const {
      user,
      elements: { dialog, preview },
      testElements: { activeTableNameDisplay },
    } = await prepareCommandPalette()

    expect(activeTableNameDisplay).toBeEmptyDOMElement()

    // select "posts" option by typing Enter key
    await user.keyboard('{ArrowDown}')
    expect(within(preview).getByText('posts')).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(dialog).not.toBeInTheDocument()
    expect(activeTableNameDisplay).toHaveTextContent(/^posts$/)
  })
})

describe('opens table in a new tab when selecting option with ⌘ key', () => {
  // It's impossible to check this behavior with vitest
  it.skip('opens the table of selected option by ⌘+click')

  it('opens the table of selected option by ⌘+Enter', async () => {
    const spyWindowOpen = vi.spyOn(window, 'open')

    const {
      user,
      elements: { preview },
    } = await prepareCommandPalette()

    // select "posts" option by typing ⌘+Enter
    await user.keyboard('{ArrowDown}')
    expect(within(preview).getByText('posts')).toBeInTheDocument()
    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(spyWindowOpen).toHaveBeenCalledWith('?active=posts')
  })
})
