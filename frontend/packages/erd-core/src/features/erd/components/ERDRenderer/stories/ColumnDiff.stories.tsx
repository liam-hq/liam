import type { Meta, StoryObj } from '@storybook/react'
import { VersionProvider } from '@/providers'
import { ErdRendererProvider } from '@/providers/ErdRendererProvider'
import { ERDRenderer } from '../ErdRenderer'
import {
  columnDiffSchema,
  createDiffData,
  mockVersion,
} from './fixtures/schemas'

const meta: Meta<typeof ERDRenderer> = {
  title: 'erd-core/ERDRenderer/Diff Patterns/Column Diff',
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Column-level diff patterns showing added, removed, and modified columns within tables.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        columnDiffSchema.current,
        columnDiffSchema.previous,
      )

      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={diffData}
              showDiff={true}
              defaultShowMode="ALL_FIELDS"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof ERDRenderer>

export const ColumnDiffPatterns: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Column Diff Patterns:**
- **Added Column**: \`name\` and \`age\` columns (green plus icon) - newly added columns
- **Removed Column**: \`username\` column (red minus icon) - column that was removed
- **Modified Column**: \`email\` column (yellow dot icon) - column with comment changes
- **Unchanged Column**: \`id\` column - no changes, no diff icon

This story demonstrates how column-level changes are visualized within table nodes with appropriate diff icons and styling.
        `,
      },
    },
  },
}

export const ColumnDiffKeyOnly: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        columnDiffSchema.current,
        columnDiffSchema.previous,
      )

      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={diffData}
              showDiff={true}
              defaultShowMode="KEY_ONLY"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Column diff patterns in KEY_ONLY mode, showing only primary and foreign key columns.',
      },
    },
  },
}

export const ColumnDiffTableNameOnly: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        columnDiffSchema.current,
        columnDiffSchema.previous,
      )

      return (
        <div style={{ height: '100vh', width: '100vw' }}>
          <VersionProvider version={mockVersion}>
            <ErdRendererProvider
              schema={diffData}
              showDiff={true}
              defaultShowMode="TABLE_NAME"
            >
              <Story />
            </ErdRendererProvider>
          </VersionProvider>
        </div>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Column diff patterns in TABLE_NAME mode, showing only table names without column details.',
      },
    },
  },
}
