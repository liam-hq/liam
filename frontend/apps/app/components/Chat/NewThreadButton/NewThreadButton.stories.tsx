import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { NewThreadButton } from './NewThreadButton'

// Define the component props type
type NewThreadButtonProps = ComponentProps<typeof NewThreadButton>

const meta = {
  component: NewThreadButton,
  title: 'Components/Chat/NewThreadButton',
} satisfies Meta<typeof NewThreadButton>

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
