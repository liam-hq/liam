import type { Meta, StoryObj } from '@storybook/react'
import { RemoveButton } from './RemoveButton'

const meta = {
  title: 'Components/RemoveButton',
  component: RemoveButton,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['transparent', 'solid'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof RemoveButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'transparent',
    size: 'sm',
  },
}

export const Transparent: Story = {
  args: {
    variant: 'transparent',
    size: 'sm',
  },
}

export const Solid: Story = {
  args: {
    variant: 'solid',
    size: 'sm',
  },
}

export const Small: Story = {
  args: {
    variant: 'transparent',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    variant: 'transparent',
    size: 'md',
  },
}

export const SolidMedium: Story = {
  args: {
    variant: 'solid',
    size: 'md',
  },
}

export const WithBackground: Story = {
  args: {
    variant: 'transparent',
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          backgroundColor: 'var(--overlay-5)',
          padding: '40px',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export const InlineExample: Story = {
  args: {
    variant: 'transparent',
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--global-background)',
          border: '1px solid var(--global-border)',
          borderRadius: 'var(--border-radius-md)',
        }}
      >
        <span>Input value</span>
        <Story />
      </div>
    ),
  ],
}
