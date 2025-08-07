import type { Meta, StoryObj } from '@storybook/react'
import { VersionProvider } from '@/providers'
import { ErdRendererProvider } from '@/providers/ErdRendererProvider'
import { ERDRenderer } from '../ErdRenderer'
import {
  constraintDiffSchema,
  createDiffData,
  mockVersion,
} from './fixtures/schemas'

const meta: Meta<typeof ERDRenderer> = {
  title: 'erd-core/ERDRenderer/Diff Patterns/Constraint Diff',
  component: ERDRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Constraint-level diff patterns showing added, removed, and modified constraints within tables.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      const diffData = createDiffData(
        constraintDiffSchema.current,
        constraintDiffSchema.previous,
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

export const ConstraintDiffPatterns: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Constraint Diff Patterns:**
- **Added Constraint**: \`posts_user_id_fkey\` and \`posts_title_unique\` (green plus icon) - newly added constraints
- **Removed Constraint**: \`posts_old_fkey\` (red minus icon) - constraint that was removed
- **Modified Constraint**: Any constraints with property changes (yellow dot icon)
- **Unchanged Constraint**: \`users_email_unique\` - no changes, no diff icon

This story demonstrates how constraint-level changes are visualized within table detail views with appropriate diff icons and styling.
        `,
      },
    },
  },
}

export const ConstraintDiffSidebarClosed: Story = {
  args: {
    defaultSidebarOpen: false,
    withAppBar: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Constraint diff patterns with sidebar closed to focus on the diagram visualization.',
      },
    },
  },
}

export const ConstraintDiffWithAppBar: Story = {
  args: {
    defaultSidebarOpen: true,
    withAppBar: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Constraint diff patterns with app bar showing the complete interface.',
      },
    },
  },
}
