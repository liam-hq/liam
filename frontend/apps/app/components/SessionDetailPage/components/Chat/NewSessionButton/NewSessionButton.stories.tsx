import type { Meta, StoryObj } from '@storybook/react'
import { NewSessionButton } from './NewSessionButton'

const meta = {
  component: NewSessionButton,
} satisfies Meta<typeof NewSessionButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithOnClick: Story = {
  args: {
    onClick: () => {
      alert('New session button clicked!')
    },
  },
}
