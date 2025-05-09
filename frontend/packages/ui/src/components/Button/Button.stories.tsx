import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'solid-primary',
        'solid-danger',
        'outline-secondary',
        'ghost-secondary',
      ],
      description: 'The visual style of the button',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
    },
    loadingIndicatorType: {
      control: 'radio',
      options: ['leftIcon', 'content'],
      description: 'Where to show the loading indicator',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'solid-primary',
    children: 'Primary Button',
    size: 'md',
  },
}

export const Danger: Story = {
  args: {
    variant: 'solid-danger',
    children: 'Danger Button',
    size: 'md',
  },
}

export const OutlineSecondary: Story = {
  args: {
    variant: 'outline-secondary',
    children: 'Outline Button',
    size: 'md',
  },
}

export const GhostSecondary: Story = {
  args: {
    variant: 'ghost-secondary',
    children: 'Ghost Button',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading Button',
  },
}

export const LoadingContent: Story = {
  args: {
    isLoading: true,
    loadingIndicatorType: 'content',
    children: 'Loading Content',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
}
