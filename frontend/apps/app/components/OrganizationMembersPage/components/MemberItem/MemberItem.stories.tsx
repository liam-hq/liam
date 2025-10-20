import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { MemberItem } from './MemberItem'

const meta = {
  component: MemberItem,
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
      description: 'Unique identifier for the member',
    },
    name: {
      control: 'text',
      description: 'Name of the member',
    },
    email: {
      control: 'text',
      description: 'Email address of the member',
    },
    initial: {
      control: 'text',
      description: 'Initial for the avatar',
    },
    avatarColor: {
      control: 'number',
      description: 'Avatar color code',
    },
    avatarUrl: {
      control: 'text',
      description: 'URL of the avatar image',
    },
    organizationId: {
      control: 'text',
      description: 'ID of the organization',
    },
    isSelf: {
      control: 'boolean',
      description: 'Whether this member is the current user',
    },
    onRemoveSuccess: {
      action: 'removed',
      description: 'Callback on successful removal',
    },
  },
} satisfies Meta<typeof MemberItem>

export default meta
type Story = StoryObj<typeof MemberItem>

export const WithAvatar: Story = {
  args: {
    id: 'member-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    initial: 'JD',
    avatarColor: 1,
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    organizationId: 'org-123',
    isSelf: false,
  },
}

export const WithoutAvatar: Story = {
  args: {
    id: 'member-2',
    name: 'Jane Smith',
    email: 'jane.smith@company.io',
    initial: 'JS',
    avatarColor: 3,
    organizationId: 'org-123',
    isSelf: false,
  },
}

export const CurrentUser: Story = {
  args: {
    id: 'member-3',
    name: 'Current User',
    email: 'current.user@organization.com',
    initial: 'CU',
    avatarColor: 5,
    organizationId: 'org-123',
    isSelf: true,
  },
}
