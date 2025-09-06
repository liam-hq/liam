import type { Meta, StoryObj } from '@storybook/nextjs'
import { BlinkCircle } from './BlinkCircle'

const meta = {
  component: BlinkCircle,
} satisfies Meta<typeof BlinkCircle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
