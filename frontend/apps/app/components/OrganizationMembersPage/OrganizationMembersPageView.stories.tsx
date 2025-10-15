import type { Meta, StoryObj } from '@storybook/nextjs'
import { OrganizationMembersPageView } from './OrganizationMembersPageView'

const meta = {
  component: OrganizationMembersPageView,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    organizationId: {
      description: 'Organization ID',
      control: 'text',
    },
    currentUserId: {
      description: 'Current user ID',
      control: 'text',
    },
  },
} satisfies Meta<typeof OrganizationMembersPageView>

export default meta
type Story = StoryObj<typeof OrganizationMembersPageView>

export const WithMembersAndInvites: Story = {
  name: 'With members and invites',
  args: {
    organizationId: 'org-123',
    currentUserId: 'user-1',
    members: [
      {
        id: 'member-1',
        joinedAt: '2024-01-15T10:00:00Z',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
        },
      },
      {
        id: 'member-2',
        joinedAt: '2024-01-20T14:30:00Z',
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar_url: null,
        },
      },
      {
        id: 'member-3',
        joinedAt: '2024-02-01T09:15:00Z',
        user: {
          id: 'user-3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          avatar_url: null,
        },
      },
    ],
    invites: [
      {
        id: 'invite-1',
        email: 'alice@example.com',
        invitedAt: '2024-03-10T12:00:00Z',
        inviteBy: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'invite-2',
        email: 'charlie@example.com',
        invitedAt: '2024-03-12T16:45:00Z',
        inviteBy: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      },
    ],
  },
}

export const EmptyState: Story = {
  name: 'Empty state',
  args: {
    organizationId: 'org-456',
    currentUserId: 'user-1',
    members: [],
    invites: [],
  },
}

export const OnlyMembers: Story = {
  name: 'Only members',
  args: {
    organizationId: 'org-789',
    currentUserId: 'user-1',
    members: [
      {
        id: 'member-1',
        joinedAt: '2024-01-15T10:00:00Z',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
        },
      },
      {
        id: 'member-2',
        joinedAt: '2024-01-20T14:30:00Z',
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar_url: null,
        },
      },
    ],
    invites: [],
  },
}

export const OnlyInvites: Story = {
  name: 'Only invites',
  args: {
    organizationId: 'org-999',
    currentUserId: 'user-1',
    members: [
      {
        id: 'member-1',
        joinedAt: '2024-01-15T10:00:00Z',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
        },
      },
    ],
    invites: [
      {
        id: 'invite-1',
        email: 'alice@example.com',
        invitedAt: '2024-03-10T12:00:00Z',
        inviteBy: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    ],
  },
}
