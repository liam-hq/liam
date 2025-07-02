import type { Meta, StoryObj } from '@storybook/nextjs'
import type { ComponentProps } from 'react'
import { NewSessionButton } from './NewSessionButton'

// Define the component props type
type NewSessionButtonProps = ComponentProps<typeof NewSessionButton>

const meta = {
  component: NewSessionButton,
  title: 'Components/Chat/NewSessionButton',
} satisfies Meta<typeof NewSessionButton>

export default meta
type Story = StoryObj<NewSessionButtonProps>

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
