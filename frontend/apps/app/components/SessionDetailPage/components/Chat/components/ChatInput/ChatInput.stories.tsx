import type { Meta, StoryObj } from '@storybook/react'
import { ChatInput } from './ChatInput'

const dummySchema = {
  enums: {},
  tables: {
    users: {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        user_id: {
          name: 'user_id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
      },
      comment: null,
      constraints: {},
      indexes: {},
    },
    posts: {
      name: 'posts',
      columns: {
        id: {
          name: 'id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        post_id: {
          name: 'post_id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        content: {
          name: 'content',
          type: 'text',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
      },
      comment: null,
      constraints: {},
      indexes: {},
    },
  },
}

const meta = {
  component: ChatInput,
  tags: ['autodocs'],
} satisfies Meta<typeof ChatInput>

export default meta
type Story = StoryObj<typeof meta>

// Default state (empty) with SendButton
export const Default: Story = {
  args: {
    onSendMessage: () => {},
    isWorkflowRunning: false,
    error: false,
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state showing the SendButton.',
      },
    },
  },
}

// Workflow running state
export const WorkflowRunning: Story = {
  args: {
    onSendMessage: () => {},
    isWorkflowRunning: true,
    error: false,
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Workflow running state where the input is disabled.',
      },
    },
  },
}

// Workflow running state with content
export const WorkflowRunningWithContent: Story = {
  args: {
    onSendMessage: () => {},
    isWorkflowRunning: true,
    error: false,
    initialMessage: 'This message is being processed...',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Workflow running state with content where the input is disabled.',
      },
    },
  },
}

// Error state with filled message with SendButton
export const WithError: Story = {
  args: {
    onSendMessage: () => {},
    isWorkflowRunning: false,
    error: true,
    initialMessage: 'This message has an error that needs to be fixed.',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state showing the SendButton disabled.',
      },
    },
  },
}

// Filled state (with content) with SendButton
export const Filled: Story = {
  args: {
    onSendMessage: () => {},
    isWorkflowRunning: false,
    error: false,
    initialMessage: 'Proposed schema changes for adding a chat function.',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Filled state showing the SendButton enabled.',
      },
    },
  },
}

// Interactive demo with state
export const Interactive: Story = {
  args: {
    onSendMessage: (msg: string) => {
      alert(`Message sent: ${msg}`)
    },
    isWorkflowRunning: false,
    error: false,
    initialMessage: '',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing the ChatInput component with SendButton. When a message is sent, it would typically switch to the workflow running state in a real application.',
      },
    },
  },
}
