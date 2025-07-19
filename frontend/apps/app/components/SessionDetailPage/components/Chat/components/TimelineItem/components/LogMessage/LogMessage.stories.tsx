import type { Meta, StoryObj } from '@storybook/react'
import { LogMessage } from './LogMessage'

const meta = {
  component: LogMessage,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    content: {
      control: 'text',
    },
  },
} satisfies Meta<typeof LogMessage>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'Analyzing requirements...',
    isLast: false,
  },
}

export const InProgress: Story = {
  args: {
    content: 'Generating ERD diagram...',
    isLast: true,
  },
}

export const Completed: Story = {
  args: {
    content: 'ERD diagram generated successfully',
    isLast: false,
  },
}

export const Failed: Story = {
  args: {
    content: 'Failed to generate ERD diagram',
    isLast: false,
    status: 'error',
  },
}

export const Pending: Story = {
  args: {
    content: 'Pending task: Review schema design',
    isLast: false,
    status: 'pending',
  },
}
