import type { Meta, StoryObj } from '@storybook/nextjs'
import { ErrorMessage } from './ErrorMessage'

const meta = {
  component: ErrorMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry clicked' },
  },
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    message: 'An error occurred while processing your request.',
  },
}

export const WithRetryButton: Story = {
  args: {
    message:
      'Failed to connect to the database. Please check your connection settings.',
    onRetry: () => {},
  },
}

export const LongErrorMessage: Story = {
  args: {
    message:
      'An error occurred while processing your request. The database connection timed out after 30 seconds. This might be due to network issues or the database server being unavailable. Please check your network connection and database server status before trying again.',
    onRetry: () => {},
  },
}

export const ShortErrorMessage: Story = {
  args: {
    message: 'Connection failed.',
    onRetry: () => {},
  },
}

export const WithoutRetryButton: Story = {
  args: {
    message:
      'This operation cannot be retried. Please contact support if the issue persists.',
  },
}

export const NetworkError: Story = {
  args: {
    message:
      'Network error: Unable to reach the server. Please check your internet connection.',
    onRetry: () => {},
  },
}

export const ValidationError: Story = {
  args: {
    message: 'Validation error: The provided schema contains invalid syntax.',
  },
}

export const PermissionError: Story = {
  args: {
    message:
      'Permission denied: You do not have access to perform this operation.',
  },
}
