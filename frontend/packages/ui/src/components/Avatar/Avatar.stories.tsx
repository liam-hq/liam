import type { Meta, StoryObj } from '@storybook/nextjs'
import { Avatar } from './Avatar'

const meta = {
  component: Avatar,
  argTypes: {
    initial: {
      control: 'text',
      description: 'Initial character displayed in avatar',
    },
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Size of the avatar',
    },
    user: {
      control: 'select',
      options: [
        'you',
        'collaborator-1',
        'collaborator-2',
        'collaborator-3',
        'collaborator-4',
        'collaborator-5',
        'collaborator-6',
        'collaborator-7',
        'collaborator-8',
        'collaborator-9',
        'collaborator-10',
        'collaborator-11',
        'jack',
      ],
      description: 'User type to determine background color',
    },
    color: {
      control: 'color',
      description: 'Custom background color',
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    initial: 'A',
    size: 'md',
    user: 'you',
  },
}

export const ExtraExtraSmall: Story = {
  args: {
    initial: 'A',
    size: 'xxs',
  },
}

export const ExtraSmall: Story = {
  args: {
    initial: 'A',
    size: 'xs',
  },
}

export const Small: Story = {
  args: {
    initial: 'A',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    initial: 'A',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    initial: 'A',
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    initial: 'A',
    size: 'xl',
  },
}

export const TwoExtraLarge: Story = {
  args: {
    initial: 'A',
    size: '2xl',
  },
}

export const Collaborator1: Story = {
  args: {
    initial: 'B',
    user: 'collaborator-1',
  },
}

export const Collaborator2: Story = {
  args: {
    initial: 'C',
    user: 'collaborator-2',
  },
}

export const Collaborator3: Story = {
  args: {
    initial: 'D',
    user: 'collaborator-3',
  },
}

export const Jack: Story = {
  args: {
    initial: 'J',
    user: 'jack',
  },
}

export const CustomColor: Story = {
  args: {
    initial: 'X',
    color: '#ff6b6b',
  },
}
