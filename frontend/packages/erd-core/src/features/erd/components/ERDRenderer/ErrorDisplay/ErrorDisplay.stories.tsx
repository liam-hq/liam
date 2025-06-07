import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import { ErrorDisplay } from './ErrorDisplay'

// Define the component props type
type ErrorDisplayProps = ComponentProps<typeof ErrorDisplay>

const meta = {
  title: 'erd-core/ERDRender/ErrorDisplay',
  component: ErrorDisplay,
  tags: ['test'],
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<ErrorDisplayProps>

export const NetworkError: Story = {
  args: {
    errors: [
      {
        name: 'NetworkError',
        message: 'Unable to connect due to a network error',
        instruction: 'Check your internet connection.',
      },
    ],
  },
}

export const OtherError: Story = {
  args: {
    errors: [
      {
        name: 'OtherError',
        message: 'Something went wrong. An unknown error has occurred.',
      },
    ],
  },
}
