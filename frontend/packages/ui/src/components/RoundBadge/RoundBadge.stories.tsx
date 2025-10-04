import type { Meta, StoryObj } from '@storybook/nextjs'
import { RoundBadge } from './RoundBadge'

const meta = {
  component: RoundBadge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'yellow', 'green', 'purple'],
      description: 'Visual style variant',
    },
    showCap: {
      control: 'boolean',
      description: 'Show cap for large numbers',
    },
    maxValue: {
      control: 'number',
      description: 'Maximum value before showing "+"',
    },
  },
} satisfies Meta<typeof RoundBadge>

export default meta
type Story = StoryObj<typeof RoundBadge>

export const Default: Story = {
  args: {
    children: '5',
    variant: 'default',
  },
}

export const Yellow: Story = {
  args: {
    children: '3',
    variant: 'yellow',
  },
}

export const Green: Story = {
  args: {
    children: '7',
    variant: 'green',
  },
}

export const Purple: Story = {
  args: {
    children: '2',
    variant: 'purple',
  },
}

export const WithCap: Story = {
  args: {
    children: 150,
    showCap: true,
    maxValue: 99,
  },
}

export const LargeNumber: Story = {
  args: {
    children: 1000,
    showCap: true,
  },
}

export const TextContent: Story = {
  args: {
    children: 'NEW',
    variant: 'yellow',
  },
}
