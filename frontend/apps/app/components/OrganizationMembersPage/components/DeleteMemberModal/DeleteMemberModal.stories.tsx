import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { DeleteMemberModal } from './DeleteMemberModal'

const meta = {
  component: DeleteMemberModal,
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
    memberId: {
      control: 'text',
      description: 'ID of the member to delete',
    },
    organizationId: {
      control: 'text',
      description: 'ID of the organization',
    },
    memberName: {
      control: 'text',
      description: 'Name of the member',
    },
    isSelf: {
      control: 'boolean',
      description: 'Whether the member is the current user',
    },
    onSuccess: {
      action: 'success',
      description: 'Callback on successful deletion',
    },
    onClose: {
      action: 'close',
      description: 'Callback when modal is closed',
    },
  },
} satisfies Meta<typeof DeleteMemberModal>

export default meta
type Story = StoryObj<typeof DeleteMemberModal>

export const Default: Story = {
  args: {
    isOpen: true,
    memberId: 'member-123',
    organizationId: 'org-456',
    memberName: 'John Doe',
    isSelf: false,
  },
}

export const RemovingSelf: Story = {
  args: {
    isOpen: true,
    memberId: 'member-123',
    organizationId: 'org-456',
    memberName: 'Current User',
    isSelf: true,
  },
}
