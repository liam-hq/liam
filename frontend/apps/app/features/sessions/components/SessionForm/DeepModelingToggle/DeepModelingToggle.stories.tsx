import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DeepModelingToggle } from './DeepModelingToggle'

const meta = {
  component: DeepModelingToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeepModelingToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isActive: false,
    children: 'Deep Modeling',
  },
}

export const Active: Story = {
  args: {
    isActive: true,
    children: 'Deep Modeling',
  },
}

export const Interactive: Story = {
  args: {
    isActive: false,
    children: 'Deep Modeling',
  },
  render: (args) => {
    const [isActive, setIsActive] = useState(args.isActive)

    return (
      <DeepModelingToggle
        {...args}
        isActive={isActive}
        onClick={() => setIsActive(!isActive)}
      >
        {args.children}
      </DeepModelingToggle>
    )
  },
}
