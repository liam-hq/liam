import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { InvitationItem } from './InvitationItem'

const meta = {
  component: InvitationItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <div style={{ width: '600px' }}>
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the invitation',
    },
    email: {
      control: 'text',
      description: 'Email address of the invited user',
    },
    initial: {
      control: 'text',
      description: 'Initial for the avatar',
    },
    avatarColor: {
      control: 'number',
      description: 'Avatar color code',
    },
    organizationId: {
      control: 'text',
      description: 'ID of the organization',
    },
  },
} satisfies Meta<typeof InvitationItem>

export default meta
type Story = StoryObj<typeof InvitationItem>

export const Default: Story = {
  args: {
    id: 'invitation-1',
    email: 'john.doe@example.com',
    initial: 'J',
    avatarColor: 1,
    organizationId: 'org-123',
  },
}

export const LongEmail: Story = {
  args: {
    id: 'invitation-2',
    email: 'very.long.email.address@example-organization.com',
    initial: 'V',
    avatarColor: 3,
    organizationId: 'org-123',
  },
}

export const DifferentColors: Story = {
  args: {
    id: 'invitation-3',
    email: 'alice.smith@company.io',
    initial: 'A',
    avatarColor: 5,
    organizationId: 'org-123',
  },
}
