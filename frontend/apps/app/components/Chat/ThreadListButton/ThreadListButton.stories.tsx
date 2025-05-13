import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { ThreadListButton } from './ThreadListButton'

// Define the component props type
type ThreadListButtonProps = ComponentProps<typeof ThreadListButton>

const meta = {
  title: 'Components/Chat/ThreadListButton',
  component: ThreadListButton,
} satisfies Meta<typeof ThreadListButton>

export default meta
type Story = StoryObj<ThreadListButtonProps>

export const Default: Story = {
  args: {},
}

export const WithOnClick: Story = {
  args: {
    onClick: () => {
      alert('Thread list button clicked!')
    },
  },
}
