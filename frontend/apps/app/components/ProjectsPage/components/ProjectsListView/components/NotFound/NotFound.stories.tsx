import type { Meta, StoryObj } from '@storybook/nextjs'
import { NotFound } from './NotFound'

const meta = {
  component: NotFound,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NotFound>

export default meta
type Story = StoryObj<typeof NotFound>

export const Default: Story = {}
