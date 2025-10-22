import type { Meta, StoryObj } from '@storybook/nextjs'
import { SessionStatusIndicator } from './SessionStatusIndicator'

const meta = {
  component: SessionStatusIndicator,
  argTypes: {
    status: {
      control: 'select',
      options: ['running', 'completed', 'error', 'idle'],
      description: 'Status of the session',
    },
  },
} satisfies Meta<typeof SessionStatusIndicator>

export default meta
type Story = StoryObj<typeof SessionStatusIndicator>

export const Running: Story = {
  args: {
    status: 'running',
  },
}

export const Completed: Story = {
  args: {
    status: 'completed',
  },
}

export const ErrorStatus: Story = {
  args: {
    status: 'error',
  },
}

export const Idle: Story = {
  args: {
    status: 'idle',
  },
}
