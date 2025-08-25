import type { Meta, StoryObj } from '@storybook/react'
import '@xyflow/react/dist/style.css'
import type React from 'react'
import type { ComponentProps, FC, PropsWithChildren } from 'react'
import { ErdRendererProvider, VersionProvider } from '@/providers'
import {
  mockAddedColumnSchema,
  mockAddedForeignKeyConstraint,
  mockAddedIndex,
  mockAddedTableSchema,
  mockAddedUniqueConstraint,
  mockCurrentSchema,
  mockModifiedColumnCommentSchema,
  mockModifiedColumnDefaultSchema,
  mockModifiedColumnTypeSchema,
  mockModifiedForeignKeyConstraint,
  mockModifiedIndexColumns,
  mockModifiedIndexType,
  mockModifiedIndexUnique,
  mockModifiedTableSchema,
  mockPreviousSchema,
  mockRemovedColumnSchema,
  mockRemovedConstraint,
  mockRemovedIndex,
  mockRemovedTableSchema,
} from '../../mocks'
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
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
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
} satisfies Meta<typeof ERDRenderer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={{ current: mockCurrentSchema, previous: mockPreviousSchema }}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const DiffModeTableNameOnly: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="TABLE_NAME"
        schema={{ current: mockCurrentSchema, previous: mockPreviousSchema }}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const DiffModeKeyOnly: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="KEY_ONLY"
        schema={{ current: mockCurrentSchema, previous: mockPreviousSchema }}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const TableAdded: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockAddedTableSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const TableRemoved: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockRemovedTableSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const TableModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedTableSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ColumnAdded: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockAddedColumnSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ColumnRemoved: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockRemovedColumnSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ColumnTypeModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedColumnTypeSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ColumnCommentModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedColumnCommentSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ColumnDefaultModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedColumnDefaultSchema}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const IndexAdded: Story = {
  decorators: [
    (Story) => (
      <Providers showDiff defaultShowMode="ALL_FIELDS" schema={mockAddedIndex}>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const IndexRemoved: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockRemovedIndex}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const IndexUniqueModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedIndexUnique}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const IndexColumnsModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedIndexColumns}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const IndexTypeModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedIndexType}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ForeignKeyConstraintAdded: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockAddedForeignKeyConstraint}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const UniqueConstraintAdded: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockAddedUniqueConstraint}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ConstraintRemoved: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockRemovedConstraint}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}

export const ForeignKeyConstraintModified: Story = {
  decorators: [
    (Story) => (
      <Providers
        showDiff
        defaultShowMode="ALL_FIELDS"
        schema={mockModifiedForeignKeyConstraint}
      >
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </Providers>
    ),
  ],
}
