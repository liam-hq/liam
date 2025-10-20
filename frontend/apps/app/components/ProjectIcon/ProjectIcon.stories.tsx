import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectIcon } from './ProjectIcon'

const meta = {
  component: ProjectIcon,
  argTypes: {
    width: {
      control: 'number',
      description: 'The width of the icon',
    },
    height: {
      control: 'number',
      description: 'The height of the icon',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof ProjectIcon>

export default meta
type Story = StoryObj<typeof ProjectIcon>

export const Default: Story = {
  args: {},
}

export const Small: Story = {
  args: {
    width: 24,
    height: 24,
  },
}

export const Large: Story = {
  args: {
    width: 64,
    height: 64,
  },
}

export const WithCustomColor: Story = {
  args: {
    style: { color: '#0066cc' },
  },
}
