import type { Meta, StoryObj } from '@storybook/nextjs'
import { JackAndOctcat } from './JackAndOctcat'

const meta = {
  component: JackAndOctcat,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof JackAndOctcat>

export default meta
type Story = StoryObj<typeof JackAndOctcat>

export const Default: Story = {}
