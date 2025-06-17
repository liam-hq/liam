import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DeepModelingToggle } from './DeepModelingToggle'

const meta: Meta<typeof DeepModelingToggle> = {
  title: 'Components/DeepModelingToggle',
  component: DeepModelingToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Toggle active state',
    },
    children: {
      control: 'text',
      description: 'Button label text',
    },
    onClick: {
      action: 'clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Deep Modeling',
    isActive: false,
  },
}

export const Active: Story = {
  args: {
    children: 'Deep Modeling',
    isActive: true,
  },
}

export const Interactive: Story = {
  render: ({ children, ...args }) => {
    const [isActive, setIsActive] = useState(false)

    return (
      <DeepModelingToggle
        {...args}
        isActive={isActive}
        onClick={() => setIsActive(!isActive)}
      >
        {children}
      </DeepModelingToggle>
    )
  },
  args: {
    children: 'Deep Modeling',
  },
}
