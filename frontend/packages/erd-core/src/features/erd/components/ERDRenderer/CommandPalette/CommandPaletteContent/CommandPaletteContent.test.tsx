import { aTable } from '@liam-hq/schema'
import { Dialog } from '@radix-ui/react-dialog'
import { render, screen } from '@testing-library/react'
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
      users: aTable({ name: 'users' }),
      posts: aTable({ name: 'posts' }),
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

describe('input mode', () => {
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
  })
})
