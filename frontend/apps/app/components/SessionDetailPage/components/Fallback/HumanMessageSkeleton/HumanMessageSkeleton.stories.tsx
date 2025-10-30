import type { Meta, StoryObj } from '@storybook/nextjs'
import { HumanMessageSkeleton } from './HumanMessageSkeleton'

const meta = {
  component: HumanMessageSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HumanMessageSkeleton>

export default meta
type Story = StoryObj<typeof HumanMessageSkeleton>

export const Default: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <HumanMessageSkeleton />
    </div>
  ),
}
