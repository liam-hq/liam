import type { Meta, StoryObj } from '@storybook/nextjs'
import { ContextMenu } from './ContextMenu'

const meta = {
  component: ContextMenu,
  parameters: {
    docs: {
      description: {
        component:
          'Right-click on the trigger element to open the context menu.',
      },
    },
  },
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof ContextMenu>

export const Default: Story = {
  args: {
    TriggerElement: (
      <div
        style={{
          border: '1px solid #ccc',
          padding: '20px',
          borderRadius: '4px',
          textAlign: 'center',
        }}
      >
        Right-click here
      </div>
    ),
    ContextMenuElement: <span>Menu Item</span>,
    onClick: () => {},
  },
}

export const WithIcon: Story = {
  args: {
    TriggerElement: (
      <div
        style={{
          border: '1px solid #ccc',
          padding: '20px',
          borderRadius: '4px',
          textAlign: 'center',
        }}
      >
        Right-click to see icon menu
      </div>
    ),
    ContextMenuElement: (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>🔧</span>
        <span>Settings</span>
      </div>
    ),
    onClick: () => {},
  },
}
