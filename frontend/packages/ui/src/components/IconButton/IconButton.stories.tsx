import type { Meta, StoryObj } from '@storybook/react'
import { Bell, Heart, Plus, Settings, User } from 'lucide-react'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Add new item',
  },
}

export const Small: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Add new item',
    size: 'sm',
  },
}

export const WithSettingsIcon: Story = {
  args: {
    icon: <Settings />,
    tooltipContent: 'Settings',
  },
}

export const WithUserIcon: Story = {
  args: {
    icon: <User />,
    tooltipContent: 'User profile',
  },
}

export const WithHeartIcon: Story = {
  args: {
    icon: <Heart />,
    tooltipContent: 'Favorite',
  },
}

export const WithBellIcon: Story = {
  args: {
    icon: <Bell />,
    tooltipContent: 'Notifications',
  },
}

export const TooltipTop: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Tooltip on top',
    tooltipSide: 'top',
  },
}

export const TooltipRight: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Tooltip on right',
    tooltipSide: 'right',
  },
}

export const TooltipLeft: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Tooltip on left',
    tooltipSide: 'left',
  },
}

export const WithClickHandler: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Click me',
    onClick: () => {
      alert('IconButton clicked!')
    },
  },
}

export const HoverBackground: Story = {
  args: {
    icon: <Plus />,
    tooltipContent: 'Hover Background Variant',
    variant: 'hoverBackground',
  },
}
