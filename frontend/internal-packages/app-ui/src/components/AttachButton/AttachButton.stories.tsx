import type { Meta, StoryObj } from '@storybook/react'
import { AttachButton } from './AttachButton'

const meta = {
  title: 'Components/AttachButton',
  component: AttachButton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AttachButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
