import type { Meta, StoryObj } from '@storybook/react'
import { BuildAgent } from './BuildAgent'

const meta = {
  component: BuildAgent,
} satisfies Meta<typeof BuildAgent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const CustomSize: Story = {
  args: {
    width: 48,
    height: 48,
  },
}
