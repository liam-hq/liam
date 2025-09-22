import { ToastProvider } from '@liam-hq/ui'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { expect, it } from 'vitest'
import { UserEditingProvider } from '../../../../../../stores'
import { CommandPaletteProvider } from '../CommandPaletteProvider'
import { CommandPaletteCommandOptions } from './CommandOptions'

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <UserEditingProvider>
      <ReactFlowProvider>
        <ToastProvider>
          <CommandPaletteProvider>
            <Command>{children}</Command>
          </CommandPaletteProvider>
        </ToastProvider>
      </ReactFlowProvider>
    </UserEditingProvider>
  </NuqsTestingAdapter>
)

it('renders options with descriptions', async () => {
  render(<CommandPaletteCommandOptions />, { wrapper })

  expect(
    screen.getByRole('option', { name: 'Copy Link ⌘ C' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Zoom to Fit ⇧ 1' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Tidy Up ⇧ T' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Show All Fields ⇧ 2' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Show Table Name ⇧ 3' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Show Key Only ⇧ 4' }),
  ).toBeInTheDocument()
})
