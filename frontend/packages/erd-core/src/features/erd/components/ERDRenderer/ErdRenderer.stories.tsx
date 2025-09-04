import type { Meta, StoryObj } from '@storybook/nextjs'
import '@xyflow/react/dist/style.css'
import type { ComponentProps, FC, PropsWithChildren } from 'react'
import { ErdRendererProvider, VersionProvider } from '../../../../providers'
import { mockCurrentSchema } from '../../mocks'
import { ERDRenderer } from './ErdRenderer'

const mockVersion = {
  version: '1.0.0',
  gitHash: 'abc123def456',
  envName: 'storybook',
  date: '2024-01-01T00:00:00Z',
  displayedOn: 'web' as const,
}

type ProvidersProps = PropsWithChildren &
  ComponentProps<typeof ErdRendererProvider>

const Providers: FC<ProvidersProps> = ({ children, ...props }) => {
  return (
    <VersionProvider version={mockVersion}>
      <ErdRendererProvider {...props}>{children}</ErdRendererProvider>
    </VersionProvider>
  )
}

const meta = {
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    defaultSidebarOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is open by default',
    },
    withAppBar: {
      control: 'boolean',
      description: 'Whether to show the app bar',
    },
  },
  decorators: [
    (Story) => (
      <Providers schema={{ current: mockCurrentSchema }}>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
} satisfies Meta<typeof ERDRenderer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
}

export const WithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
}

export const SidebarClosed: Story = {
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
  },
}

export const TableNameMode: Story = {
  decorators: [
    (Story) => (
      <Providers
        defaultShowMode="TABLE_NAME"
        schema={{ current: mockCurrentSchema }}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const KeyOnlyMode: Story = {
  decorators: [
    (Story) => (
      <Providers
        defaultShowMode="KEY_ONLY"
        schema={{ current: mockCurrentSchema }}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}
