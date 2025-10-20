import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { UserDropdown } from './UserDropdown'

const meta = {
  component: UserDropdown,
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
    avatarUrl: {
      control: 'text',
      description: 'URL of the user avatar image',
    },
    userName: {
      control: 'text',
      description: 'Name of the user',
    },
    userEmail: {
      control: 'text',
      description: 'Email address of the user',
    },
  },
} satisfies Meta<typeof UserDropdown>

export default meta
type Story = StoryObj<typeof UserDropdown>

export const WithAvatar: Story = {
  args: {
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
  },
}

export const WithoutAvatar: Story = {
  args: {
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
  },
}

export const WithEmailOnly: Story = {
  args: {
    userEmail: 'user@example.com',
  },
}

export const Anonymous: Story = {
  args: {},
}
