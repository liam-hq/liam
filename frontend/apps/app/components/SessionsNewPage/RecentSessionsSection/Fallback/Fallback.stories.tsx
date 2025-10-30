import type { Meta, StoryObj } from '@storybook/nextjs'
import { Fallback } from './Fallback'

const meta = {
  component: Fallback,
  parameters: {
    layout: 'padded',
  },
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Fallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
