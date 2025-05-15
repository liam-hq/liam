import type { Meta } from '@storybook/react'
import { ChatInput } from './ChatInput'

const meta = {
  component: ChatInput,
  title: 'Components/Chat/ChatInput',
} satisfies Meta<typeof ChatInput>

export default meta

// Default state (empty) with SendButton
export const Default = {
  args: {
    onSendMessage: () => {},
    isLoading: false,
    error: false,
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
export const Loading = {
  args: {
    onSendMessage: () => {},
    isLoading: true,
    error: false,
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
export const LoadingWithContent = {
  args: {
    onSendMessage: () => {},
    isLoading: true,
    error: false,
    initialMessage: 'This message is being processed...',
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
export const WithError = {
  args: {
    onSendMessage: () => {},
    isLoading: false,
    error: true,
    initialMessage: 'This message has an error that needs to be fixed.',
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
export const Filled = {
  args: {
    onSendMessage: () => {},
    isLoading: false,
    error: false,
    initialMessage: 'Proposed schema changes for adding a chat function.',
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
export const Interactive = {
  args: {
    onSendMessage: (msg: string) => {
      alert(`Message sent: ${msg}`)
    },
    isLoading: false,
    error: false,
    initialMessage: '',
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
