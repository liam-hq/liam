import type { Meta, StoryObj } from '@storybook/nextjs'
import { ReasoningMessage } from './ReasoningMessage'

const meta = {
  component: ReasoningMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      description: 'The reasoning content to display',
      control: 'text',
    },
    isWorkflowRunning: {
      description: 'Whether the workflow is currently running',
      control: 'boolean',
    },
    durationMs: {
      description: 'Duration of reasoning in milliseconds',
      control: 'number',
    },
  },
} satisfies Meta<typeof ReasoningMessage>

export default meta
type Story = StoryObj<typeof meta>

const sampleContent = `## Analyzing Requirements

I'm analyzing the user's request to create a user management system. This involves several key components:

1. **User Authentication**: We'll need to implement secure login/logout functionality
2. **User Profiles**: Storage and management of user information
3. **Role Management**: Different permission levels for various user types
4. **Data Validation**: Ensuring all user inputs are properly validated

### Database Schema Considerations

For this system, we'll need the following tables:
- \`users\` table with fields for basic user information
- \`roles\` table to define different permission levels
- \`user_roles\` junction table for many-to-many relationships

This approach will provide flexibility for future expansions while maintaining data integrity.`

export const Streaming: Story = {
  args: {
    content: sampleContent,
    isWorkflowRunning: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the "Reasoning..." state with animated dots while content is being streamed.',
      },
    },
  },
}

export const Finished: Story = {
  args: {
    content: sampleContent,
    isWorkflowRunning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the "Reasoning finished" state after content has been fully received (backward compatibility for messages without duration).',
      },
    },
  },
}

export const WithDuration: Story = {
  args: {
    content: sampleContent,
    isWorkflowRunning: false,
    durationMs: 65000, // 1 minute 5 seconds
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows "Reasoned for 1m 5s" when the reasoning completed with duration tracking.',
      },
    },
  },
}
