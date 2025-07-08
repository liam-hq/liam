import type { Meta, StoryObj } from '@storybook/react'
import { UserMessage } from '.'

const meta = {
  component: UserMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UserMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'Hello, this is a sample user message.',
    initial: 'U',
    userName: 'User',
  },
}

export const LongMessage: Story = {
  args: {
    content:
      'This is a sample of a long message. Proposed schema changes for adding a chat function. Proposed schema changes for adding a chat function. Proposed schema changes for adding a chat function.',
    initial: 'U',
  },
}

export const WithTimestamp: Story = {
  args: {
    content: 'Message with timestamp.',
    initial: 'U',
    userName: 'John Doe',
    timestamp: new Date(),
  },
}

export const WithoutInitial: Story = {
  args: {
    content: 'Message without initial.',
    timestamp: new Date(),
  },
}

export const WithDefaultName: Story = {
  args: {
    content: "Message with default 'User Name' when userName is not provided.",
    initial: 'D',
    timestamp: new Date(),
  },
}

export const WithImageAvatar: Story = {
  args: {
    content: 'Message with image avatar.',
    avatarSrc: 'https://i.pravatar.cc/150?img=3',
    avatarAlt: 'User avatar',
    userName: 'Jane Smith',
    timestamp: new Date(),
  },
}

export const WithUserNameOnly: Story = {
  args: {
    content: 'Message with user name but no timestamp.',
    initial: 'U',
    userName: 'Alex Johnson',
  },
}
