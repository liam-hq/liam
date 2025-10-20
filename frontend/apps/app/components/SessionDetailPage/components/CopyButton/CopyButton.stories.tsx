import type { Meta, StoryObj } from '@storybook/nextjs'
import { CopyButton } from './CopyButton'

const meta = {
  component: CopyButton,
  argTypes: {
    textToCopy: {
      control: 'text',
      description: 'The text to copy to clipboard',
    },
    tooltipLabel: {
      control: 'text',
      description: 'The label to show in the tooltip',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'The size of the button',
    },
  },
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof CopyButton>

export const Medium: Story = {
  args: {
    textToCopy: 'Hello, World!',
    tooltipLabel: 'Copy to clipboard',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    textToCopy: 'Sample text',
    tooltipLabel: 'Copy',
    size: 'sm',
  },
}

export const LongText: Story = {
  args: {
    textToCopy:
      'This is a longer text that will be copied to the clipboard when the button is clicked.',
    tooltipLabel: 'Copy long text',
    size: 'md',
  },
}
