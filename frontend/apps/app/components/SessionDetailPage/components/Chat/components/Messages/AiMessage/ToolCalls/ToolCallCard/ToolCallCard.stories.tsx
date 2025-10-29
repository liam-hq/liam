import type { ToolCall } from '@liam-hq/agent/client'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ToolCallCard } from './ToolCallCard'

const meta = {
  component: ToolCallCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    call: {
      description: 'Tool call data',
    },
    result: {
      description: 'Tool result message (optional)',
    },
    onNavigate: {
      action: 'navigate',
      description: 'Callback when navigating to a tab',
    },
  },
} satisfies Meta<typeof ToolCallCard>

export default meta
type Story = StoryObj<typeof ToolCallCard>

const sampleCall: ToolCall = {
  name: 'createMigrationTool',
  args: {
    requirements: 'Design a user authentication schema',
  },
  id: 'call-1',
  type: 'tool_call',
}

export const Running: Story = {
  args: {
    call: sampleCall,
    result: undefined,
  },
}

export const Success: Story = {
  args: {
    call: sampleCall,
    // @ts-expect-error - Using partial ToolMessage for story demo
    result: {
      content: 'Schema design completed successfully',
      name: 'createMigrationTool',
      id: 'result-1',
      status: 'success',
      tool_call_id: 'call-1',
    },
  },
}

export const ErrorState: Story = {
  args: {
    call: sampleCall,
    // @ts-expect-error - Using partial ToolMessage for story demo
    result: {
      content: 'Schema validation failed',
      name: 'createMigrationTool',
      id: 'result-2',
      status: 'error',
      tool_call_id: 'call-1',
    },
  },
}
