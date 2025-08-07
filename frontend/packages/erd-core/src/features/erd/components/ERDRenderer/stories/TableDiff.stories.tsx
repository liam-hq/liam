import type { Meta, StoryObj } from '@storybook/react'
import { VersionProvider } from '@/providers'
import { ErdRendererProvider } from '@/providers/ErdRendererProvider'
import { ERDRenderer } from '../ErdRenderer'
import {
  createDiffData,
  mockVersion,
  tableDiffSchema,
} from './fixtures/schemas'

const meta: Meta<typeof ERDRenderer> = {
  title: 'erd-core/ERDRenderer/Diff Patterns/Table Diff',
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Table-level diff patterns showing added, removed, and modified tables.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        tableDiffSchema.current,
        tableDiffSchema.previous,
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

export const TableDiffPatterns: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Table Diff Patterns:**
- **Added Table**: \`comments\` table (green plus icon) - newly added table
- **Removed Table**: \`categories\` table (red minus icon) - table that was removed
- **Modified Table**: \`users\` table (yellow dot icon) - table with comment changes
- **Unchanged Table**: \`posts\` table - no changes, no diff icon

This story demonstrates how table-level changes are visualized in the ERD with appropriate diff icons and styling.
        `,
      },
    },
  },
}

export const TableDiffSidebarClosed: Story = {
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table diff patterns with sidebar closed to focus on the diagram visualization.',
      },
    },
  },
}

export const TableDiffWithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table diff patterns with app bar showing the complete interface.',
      },
    },
  },
}
