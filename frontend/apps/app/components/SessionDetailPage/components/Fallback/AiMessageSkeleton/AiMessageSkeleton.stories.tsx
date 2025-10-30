import type { Meta, StoryObj } from '@storybook/nextjs'
import { AiMessageSkeleton } from './AiMessageSkeleton'

const meta = {
  component: AiMessageSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    noOfLines: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Number of lines in the message skeleton',
    },
  },
} satisfies Meta<typeof AiMessageSkeleton>

export default meta
type Story = StoryObj<typeof AiMessageSkeleton>

export const Default: Story = {
  args: {
    noOfLines: 4,
  },
  render: (args) => (
    <div style={{ width: '600px' }}>
      <AiMessageSkeleton {...args} />
    </div>
  ),
}

export const Multiple: Story = {
  render: () => (
    <div
      style={{
        width: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <AiMessageSkeleton noOfLines={3} />
      <AiMessageSkeleton noOfLines={5} />
      <AiMessageSkeleton noOfLines={7} />
    </div>
  ),
}
