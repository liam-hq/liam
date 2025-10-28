import type { Meta, StoryObj } from '@storybook/nextjs'
import { SessionStatusIndicator } from './SessionStatusIndicator'

const meta = {
  component: SessionStatusIndicator,
  argTypes: {
    status: {
      control: 'select',
      options: ['pending', 'success', 'error'],
      description: 'Status of the session',
    },
  },
} satisfies Meta<typeof SessionStatusIndicator>

export default meta
type Story = StoryObj<typeof SessionStatusIndicator>

export const Running: Story = {
  args: {
    status: 'pending',
  },
}

export const Completed: Story = {
  args: {
    status: 'success',
  },
}

export const ErrorState: Story = {
  args: {
    status: 'error',
  },
}
