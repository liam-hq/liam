import { aTable } from '@liam-hq/schema'
import { Dialog } from '@radix-ui/react-dialog'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  type SchemaProviderValue,
  UserEditingProvider,
} from '../../../../../../stores'
import { CommandPaletteProvider } from '../CommandPaletteProvider'
import { CommandPaletteContent } from './CommandPaletteContent'

const schema: SchemaProviderValue = {
  current: {
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'bigint',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
          name: {
            name: 'name',
            type: 'text',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
        },
      }),
      posts: aTable({
        name: 'posts',
        columns: {
          created_at: {
            name: 'created_at',
            type: 'timestamp',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
        },
      }),
      follows: aTable({ name: 'follows' }),
      user_settings: aTable({ name: 'user_settings' }),
    },
    enums: {},
    extensions: {},
  },
}

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <ReactFlowProvider>
      <UserEditingProvider>
        <SchemaProvider {...schema}>
          <Dialog>
            <CommandPaletteProvider>{children}</CommandPaletteProvider>
          </Dialog>
        </SchemaProvider>
      </UserEditingProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

describe('input mode and filters', () => {
  describe('default input mode', () => {
    it('renders table options and command options', () => {
      render(<CommandPaletteContent />, { wrapper })

      // table options
      expect(screen.getByRole('option', { name: 'users' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'posts' })).toBeInTheDocument()

      // command options
      expect(
        screen.getByRole('option', { name: 'Copy Link ⌘ C' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Show All Fields ⇧ 2' }),
      ).toBeInTheDocument()
    })

    it('filters options based on user input in the combobox', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      const searchCombobox = screen.getByRole('combobox')
      await user.type(searchCombobox, 'p')

      // options with "p"
      expect(screen.getByRole('option', { name: 'posts' })).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Copy Link ⌘ C' }),
      ).toBeInTheDocument()

      // options without "p"
      expect(
        screen.queryByRole('option', { name: 'users' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('option', { name: 'Show All Fields ⇧ 2' }),
      ).not.toBeInTheDocument()
    })

    it('renders "No results found." if user input does not match any options', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      const searchCombobox = screen.getByRole('combobox')
      await user.type(searchCombobox, 'Hello World')

      expect(screen.queryByRole('option')).not.toBeInTheDocument()
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })
  })

  describe('command input mode', () => {
    it('renders only command options', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      // switch to "command" input mode
      await user.keyboard('>')

      // table options
      expect(
        screen.queryByRole('option', { name: 'users' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('option', { name: 'posts' }),
      ).not.toBeInTheDocument()

      // command options
      expect(
        screen.getByRole('option', { name: 'Copy Link ⌘ C' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Zoom to Fit ⇧ 1' }),
      ).toBeInTheDocument()
    })

    it('filters options based on user input in the combobox', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      // switch to "command" input mode
      await user.keyboard('>')

      const searchCombobox = screen.getByRole('combobox')
      await user.type(searchCombobox, 'p')

      // options with "p"
      expect(
        screen.getByRole('option', { name: 'Copy Link ⌘ C' }),
      ).toBeInTheDocument()

      // options with "p" but not table options
      expect(
        screen.queryByRole('option', { name: 'posts' }),
      ).not.toBeInTheDocument()

      // options without "p"
      expect(
        screen.queryByRole('option', { name: 'Show All Fields ⇧ 2' }),
      ).not.toBeInTheDocument()
    })

    it('renders "No results found." if user input does not match any command options', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      // switch to "command" input mode
      await user.keyboard('>')

      const searchCombobox = screen.getByRole('combobox')
      await user.type(searchCombobox, 'users')

      expect(screen.queryByRole('option')).not.toBeInTheDocument()
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })
  })

  describe('table input mode', () => {
    it('renders selected table option and its column options', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      // switch to "table" input mode of the "users" table
      await user.keyboard('users')
      await user.keyboard('{Tab}')

      // the "users" table option is always displayed on the top of the options list
      expect(screen.getByRole('option', { name: 'users' })).toBeInTheDocument()
      // column options of the "users" table
      expect(screen.getByRole('option', { name: 'id' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'name' })).toBeInTheDocument()
    })

    it('filters column options by user input in the combobox while keeping the selected table option visible', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })

      // switch to "table" input mode of the "users" table
      await user.keyboard('users')
      await user.keyboard('{Tab}')
      // filter the column options by typing "name"
      await user.keyboard('name')

      expect(screen.getByRole('option', { name: 'users' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'name' })).toBeInTheDocument()
      // the "id" column option is filtered out
      expect(
        screen.queryByRole('option', { name: 'id' }),
      ).not.toBeInTheDocument()
    })
  })
})

describe('preview', () => {
  describe('table preview', () => {
    it('renders a table preview when a table option is selected', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })
      const previewContainer = screen.getByTestId('CommandPalettePreview')

      // renders the "users" preview when the "users" option is selected
      await user.hover(screen.getByRole('option', { name: 'users' }))
      expect(within(previewContainer).getByText('users')).toBeInTheDocument()

      // renders the "posts" preview when the "posts" option is selected
      await user.hover(screen.getByRole('option', { name: 'posts' }))
      expect(within(previewContainer).getByText('posts')).toBeInTheDocument()
    })

    it('renders a table preview when a column option is selected', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })
      const previewContainer = screen.getByTestId('CommandPalettePreview')

      // renders the "users" preview when the "users/name" option is selected
      await user.hover(screen.getByRole('option', { name: 'users' }))
      // go to the "table" input mode of the "users" table
      await user.keyboard('{Tab}')
      await user.hover(screen.getByRole('option', { name: 'name' }))
      expect(within(previewContainer).getByText('users')).toBeInTheDocument()

      // back to the "default" input mode
      await user.keyboard('{Backspace}')

      // renders the "posts" preview when the "posts/created_at" option is selected
      await user.hover(screen.getByRole('option', { name: 'posts' }))
      // go to the "table" input mode of the "posts" table
      await user.keyboard('{Tab}')
      await user.hover(screen.getByRole('option', { name: 'created_at' }))
      expect(within(previewContainer).getByText('posts')).toBeInTheDocument()
    })
  })

  describe('command preview', () => {
    it('renders a command preview when a command option is selected', async () => {
      const user = userEvent.setup()
      render(<CommandPaletteContent />, { wrapper })
      const previewContainer = screen.getByTestId('CommandPalettePreview')

      // renders the "Copy Link" preview when the "Copy Link" option is selected
      await user.hover(screen.getByRole('option', { name: 'Copy Link ⌘ C' }))
      expect(
        within(previewContainer).getByLabelText(
          'Demonstration of the copy link command execution result',
        ),
      ).toBeInTheDocument()

      // renders the "Show All Fields" preview when the "Show All Fields" option is selected
      await user.hover(
        screen.getByRole('option', { name: 'Show All Fields ⇧ 2' }),
      )
      expect(
        within(previewContainer).getByAltText(
          'Demonstration of the Show All Fields command execution result',
        ),
      ).toBeInTheDocument()
    })
  })
})
