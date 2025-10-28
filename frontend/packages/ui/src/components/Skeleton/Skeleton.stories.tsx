import type { Meta, StoryObj } from '@storybook/nextjs'
import { Skeleton } from './Skeleton'

const meta = {
  component: Skeleton,
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Whether to show the skeleton or the children',
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton',
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton',
    },
    minWidth: {
      control: 'text',
      description: 'Minimum width of the skeleton',
    },
    maxWidth: {
      control: 'text',
      description: 'Maximum width of the skeleton',
    },
    minHeight: {
      control: 'text',
      description: 'Minimum height of the skeleton',
    },
    maxHeight: {
      control: 'text',
      description: 'Maximum height of the skeleton',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: {
    children: 'Loading...',
  },
}

export const WithCustomSize: Story = {
  args: {
    width: '200px',
    height: '40px',
  },
}

export const WithText: Story = {
  args: {
    loading: true,
    children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
}

export const WithTextNotLoading: Story = {
  args: {
    loading: false,
    children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
}

export const WithLongParagraph: Story = {
  args: {
    loading: true,
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque felis tellus, efficitur id convallis a, viverra eget libero. Nam magna erat, fringilla sed commodo sed, aliquet nec magna.',
  },
}

export const Circle: Story = {
  args: {
    width: '48px',
    height: '48px',
    style: { borderRadius: '50%' },
  },
}

export const Rectangle: Story = {
  args: {
    width: '100%',
    height: '20px',
  },
}

export const SmallBox: Story = {
  args: {
    width: '48px',
    height: '48px',
  },
}

export const WithButton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Skeleton loading={true}>
        <button type="button">Click me</button>
      </Skeleton>
      <Skeleton loading={false}>
        <button type="button">Click me</button>
      </Skeleton>
    </div>
  ),
}

export const MultipleSkeletons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton width="100%" height="20px" />
      <Skeleton width="100%" height="20px" />
      <Skeleton width="80%" height="20px" />
    </div>
  ),
}
