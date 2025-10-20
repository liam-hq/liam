import type { Meta, StoryObj } from '@storybook/nextjs'
import { ScrollToBottomButton } from './ScrollToBottomButton'

const meta = {
  component: ScrollToBottomButton,
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the button is visible',
    },
    onClick: {
      action: 'clicked',
      description: 'Called when the button is clicked',
    },
  },
} satisfies Meta<typeof ScrollToBottomButton>

export default meta
type Story = StoryObj<typeof ScrollToBottomButton>

export const Visible: Story = {
  args: {
    visible: true,
    onClick: () => {},
  },
}

export const Hidden: Story = {
  args: {
    visible: false,
    onClick: () => {},
  },
}
