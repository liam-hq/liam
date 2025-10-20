import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { DeleteInvitationModal } from './DeleteInvitationModal'

const meta = {
  component: DeleteInvitationModal,
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
    invitationId: {
      control: 'text',
      description: 'ID of the invitation to delete',
    },
    organizationId: {
      control: 'text',
      description: 'ID of the organization',
    },
    email: {
      control: 'text',
      description: 'Email address of the invited user',
    },
    onClose: {
      action: 'close',
      description: 'Callback when modal is closed',
    },
  },
} satisfies Meta<typeof DeleteInvitationModal>

export default meta
type Story = StoryObj<typeof DeleteInvitationModal>

export const Default: Story = {
  args: {
    isOpen: true,
    invitationId: 'invitation-123',
    organizationId: 'org-456',
    email: 'user@example.com',
  },
}
