import type { Meta, StoryObj } from '@storybook/react'
import { ThreadListButton } from './ThreadListButton'

const meta = {
  component: ThreadListButton,
  tags: ['autodocs'],
} satisfies Meta<typeof ThreadListButton>

export default meta
type Story = StoryObj<typeof meta>

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
