import type { Meta, StoryObj } from '@storybook/nextjs'
import { SessionStatusIndicator } from './SessionStatusIndicator'

const meta = {
  component: SessionStatusIndicator,
  argTypes: {
    status: {
      control: 'select',
      options: ['running', 'idle'],
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

export const Idle: Story = {
  args: {
    status: 'idle',
  },
}
