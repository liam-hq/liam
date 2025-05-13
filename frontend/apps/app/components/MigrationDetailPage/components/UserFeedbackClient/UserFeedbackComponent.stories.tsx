import type { Meta, StoryObj } from '@storybook/react'
import { UserFeedbackComponent } from './UserFeedbackComponent'

// For Storybook, we'll use a mock implementation
// The actual implementation is handled in preview.ts

const meta = {
  title: 'Components/UserFeedback',
  component: UserFeedbackComponent,
} satisfies Meta<typeof UserFeedbackComponent>

export default meta
type Story = StoryObj<typeof UserFeedbackComponent>

export const Default: Story = {
  args: {
    traceId: 'sample-trace-id',
  },
}

export const WithoutTraceId: Story = {
  args: {
    traceId: null,
  },
}
