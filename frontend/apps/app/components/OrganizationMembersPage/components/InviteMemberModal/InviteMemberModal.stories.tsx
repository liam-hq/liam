import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { InviteMemberModal } from './InviteMemberModal'

const meta = {
  component: InviteMemberModal,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    organizationId: {
      control: 'text',
      description: 'ID of the organization to invite members to',
    },
    onClose: {
      action: 'close',
      description: 'Callback when modal is closed',
    },
  },
} satisfies Meta<typeof InviteMemberModal>

export default meta
type Story = StoryObj<typeof InviteMemberModal>

export const Default: Story = {
  args: {
    isOpen: true,
    organizationId: 'org-456',
  },
}
