import type { Meta, StoryObj } from '@storybook/nextjs'
import { Callout } from './Callout'

const meta = {
  component: Callout,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'danger', 'success', 'info', 'warning'],
      description: 'The visual style of the callout',
    },
    device: {
      control: 'select',
      options: ['default', 'mobile'],
      description: 'Device-specific styling',
    },
    children: {
      control: 'text',
      description: 'Content to display in the callout',
    },
  },
} satisfies Meta<typeof Callout>

export default meta
type Story = StoryObj<typeof Callout>

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'This is a default callout message.',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'This is a danger callout message.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'This is a success callout message.',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an info callout message.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'This is a warning callout message.',
  },
}

export const Mobile: Story = {
  args: {
    variant: 'info',
    device: 'mobile',
    children: 'This callout is optimized for mobile devices.',
  },
}

export const LongContent: Story = {
  args: {
    variant: 'info',
    children:
      'This is a callout with a longer message to demonstrate how the component handles multiple lines of text. The content should wrap properly and maintain good readability.',
  },
}
