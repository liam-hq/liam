import type { Meta, StoryObj } from '@storybook/nextjs'
import { ShareDialog } from './ShareDialog'

const meta = {
  component: ShareDialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    designSessionId: {
      control: 'text',
      description: 'ID of the design session to share',
    },
    initialIsPublic: {
      control: 'boolean',
      description: 'Initial public/private state',
    },
    onClose: {
      action: 'close',
      description: 'Callback when dialog is closed',
    },
  },
} satisfies Meta<typeof ShareDialog>

export default meta
type Story = StoryObj<typeof ShareDialog>

export const Private: Story = {
  args: {
    isOpen: true,
    designSessionId: 'session-123',
    initialIsPublic: false,
  },
}

export const Public: Story = {
  args: {
    isOpen: true,
    designSessionId: 'session-123',
    initialIsPublic: true,
  },
}
