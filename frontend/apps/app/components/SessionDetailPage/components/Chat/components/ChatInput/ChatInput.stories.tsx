import type { Meta, StoryObj } from '@storybook/react'
import { ChatInput } from './ChatInput'

const dummySchema = {
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
    isLoading: false,
    error: false,
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state showing the SendButton when not loading.',
      },
    },
  },
}

// Loading state with CancelButton
export const Loading: Story = {
  args: {
    onSendMessage: () => {},
    isLoading: true,
    error: false,
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state showing the CancelButton instead of the SendButton. The border color remains default and no box shadow is applied.',
      },
    },
  },
}

// Loading state with content and CancelButton
export const LoadingWithContent: Story = {
  args: {
    onSendMessage: () => {},
    isLoading: true,
    error: false,
    initialMessage: 'This message is being processed...',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with content showing the CancelButton instead of the SendButton. The border color remains default and no box shadow is applied.',
      },
    },
  },
}

// Error state with filled message with SendButton
export const WithError: Story = {
  args: {
    onSendMessage: () => {},
    isLoading: false,
    error: true,
    initialMessage: 'This message has an error that needs to be fixed.',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state showing the SendButton when not loading.',
      },
    },
  },
}

// Filled state (with content) with SendButton
export const Filled: Story = {
  args: {
    onSendMessage: () => {},
    isLoading: false,
    error: false,
    initialMessage: 'Proposed schema changes for adding a chat function.',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story: 'Filled state showing the SendButton when not loading.',
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
    isLoading: false,
    error: false,
    initialMessage: '',
    schema: dummySchema,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing the ChatInput component with SendButton by default. When a message is sent, it would typically switch to the loading state with CancelButton in a real application.',
      },
    },
  },
}
