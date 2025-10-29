import type { Meta, StoryObj } from '@storybook/nextjs'
import { Skeleton } from './Skeleton'

const meta = {
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['box', 'circle', 'text'],
      description: 'Skeleton variant',
    },
    width: {
      control: 'text',
      description: 'Width for box variant (e.g., 200px, 50%)',
    },
    height: {
      control: 'text',
      description: 'Height for box variant (e.g., 16px)',
    },
    size: {
      control: 'text',
      description: 'Diameter for circle variant (e.g., 48px)',
    },
    noOfLines: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Number of lines for text variant',
    },
    gap: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Gap between lines in pixels',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof Skeleton>

export const Box: Story = {
  args: {
    variant: 'box',
    width: '240px',
    height: '64px',
  },
}

export const Circle: Story = {
  args: {
    variant: 'circle',
    size: '48px',
  },
}

export const Text: Story = {
  args: {
    variant: 'text',
    noOfLines: 3,
    gap: 8,
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <Skeleton {...args} />
    </div>
  ),
}

export const WithStartAndEndColor: Story = {
  args: {
    variant: 'box',
    width: '240px',
    height: '64px',
    startColor: '#ec4899',
    endColor: '#f97316',
  },
}
