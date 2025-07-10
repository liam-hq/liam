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
  },
}
