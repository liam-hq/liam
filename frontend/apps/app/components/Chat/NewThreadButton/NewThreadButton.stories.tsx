import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { NewThreadButton } from './NewThreadButton'

// Define the component props type
type NewThreadButtonProps = ComponentProps<typeof NewThreadButton>

const meta: Meta<typeof NewThreadButton> = {
  title: 'Components/Chat/NewThreadButton',
  component: NewThreadButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<NewThreadButtonProps>

export const Default: Story = {
  args: {},
}

export const WithOnClick: Story = {
  args: {
    onClick: () => {
      alert('New thread button clicked!')
    },
  },
}
