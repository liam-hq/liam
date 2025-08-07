import type { Meta, StoryObj } from '@storybook/react'
import { VersionProvider } from '@/providers'
import { ErdRendererProvider } from '@/providers/ErdRendererProvider'
import { ERDRenderer } from '../ErdRenderer'
import {
  createDiffData,
  indexDiffSchema,
  mockVersion,
} from './fixtures/schemas'

const meta: Meta<typeof ERDRenderer> = {
  title: 'erd-core/ERDRenderer/Diff Patterns/Index Diff',
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Index-level diff patterns showing added, removed, and modified indexes within tables.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        indexDiffSchema.current,
        indexDiffSchema.previous,
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

export const IndexDiffPatterns: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Index Diff Patterns:**
- **Added Index**: \`users_name_idx\` and \`users_email_name_idx\` (green plus icon) - newly added indexes
- **Removed Index**: \`users_old_idx\` (red minus icon) - index that was removed
- **Modified Index**: \`users_email_idx\` (yellow dot icon) - index with unique property changed
- **Unchanged Index**: Any indexes without changes - no diff icon

This story demonstrates how index-level changes are visualized within table detail views with appropriate diff icons and styling.
        `,
      },
    },
  },
}

export const IndexDiffSidebarClosed: Story = {
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Index diff patterns with sidebar closed to focus on the diagram visualization.',
      },
    },
  },
}

export const IndexDiffWithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Index diff patterns with app bar showing the complete interface.',
      },
    },
  },
}
