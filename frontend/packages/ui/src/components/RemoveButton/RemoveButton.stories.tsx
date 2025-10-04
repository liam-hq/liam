import type { Meta, StoryObj } from '@storybook/nextjs'
import { RemoveButton } from './RemoveButton'

const meta = {
  component: RemoveButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['transparent', 'solid'],
      description: 'The visual style of the remove button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'The size of the remove button',
    },
  },
} satisfies Meta<typeof RemoveButton>

export default meta
type Story = StoryObj<typeof RemoveButton>

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
