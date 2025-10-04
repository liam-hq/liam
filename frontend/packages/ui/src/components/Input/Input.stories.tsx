import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from './Input'

const meta = {
  component: Input,
  argTypes: {
    size: {
      control: 'select',
      options: ['md', 'sm', 'xs'],
      description: 'Size of the input',
    },
    align: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Text alignment',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input has an error state',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    size: 'md',
  },
}

export const Medium: Story = {
  args: {
    placeholder: 'Medium input',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    placeholder: 'Small input',
    size: 'sm',
  },
}

export const ExtraSmall: Story = {
  args: {
    placeholder: 'Extra small input',
    size: 'xs',
  },
}

export const RightAligned: Story = {
  args: {
    placeholder: '100',
    align: 'right',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const ReadOnly: Story = {
  args: {
    value: 'Read-only value',
    readOnly: true,
  },
}

export const WithError: Story = {
  args: {
    placeholder: 'Input with error',
    error: true,
  },
}

export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Search...',
    leftIcon: <span>🔍</span>,
  },
}

export const WithRightIcon: Story = {
  args: {
    placeholder: 'Email',
    rightIcon: <span>✉️</span>,
  },
}

export const WithBothIcons: Story = {
  args: {
    placeholder: 'Username',
    leftIcon: <span>👤</span>,
    rightIcon: <span>✓</span>,
  },
}
