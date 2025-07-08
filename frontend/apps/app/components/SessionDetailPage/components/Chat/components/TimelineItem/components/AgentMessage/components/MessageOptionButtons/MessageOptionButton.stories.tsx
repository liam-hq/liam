import type { Meta, StoryObj } from '@storybook/react'
import { MessageOptionButton } from './MessageOptionButton'

const meta = {
  component: MessageOptionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => <MessageOptionButton {...args} />,
} satisfies Meta<typeof MessageOptionButton>

export default meta
type Story = StoryObj<typeof meta>

// Individual MessageOptionButton examples
export const BuildDefault: Story = {
  args: {
    text: 'Options for interacting with LLM during database design.',
    isSelected: false,
    isDisabled: false,
  },
}

export const BuildSelected: Story = {
  args: {
    text: 'Options for interacting with LLM during database design.',
    isSelected: true,
    isDisabled: false,
  },
}

export const BuildDisabled: Story = {
  args: {
    text: 'Options for interacting with LLM during database design.',
    isSelected: false,
    isDisabled: true,
  },
}
