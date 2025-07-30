import type { Meta, StoryObj } from '@storybook/react'
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
    name: 'default-toggle',
    defaultChecked: false,
    children: 'Deep Modeling',
  },
}

export const Active: Story = {
  args: {
    name: 'active-toggle',
    defaultChecked: true,
    children: 'Deep Modeling',
  },
}

export const Interactive: Story = {
  args: {
    name: 'interactive-toggle',
    defaultChecked: false,
    children: 'Deep Modeling',
  },
  render: (args) => {
    return (
      <form>
        <DeepModelingToggle {...args}>{args.children}</DeepModelingToggle>
      </form>
    )
  },
}
