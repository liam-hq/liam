import type { Meta, StoryObj } from '@storybook/react'
import { WarningMessage } from './WarningMessage'

const meta = {
  component: WarningMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
    },
    onAction: {
      action: 'action',
    },
    actionLabel: {
      control: 'text',
    },
  },
} satisfies Meta<typeof WarningMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    message:
      'This is a warning message. The operation completed with warnings.',
  },
}

export const WithAction: Story = {
  args: {
    message:
      'Warning: Some data might be incomplete. Please review the results.',
    onAction: () => {},
    actionLabel: 'Review',
  },
}

export const WithAcknowledge: Story = {
  args: {
    message:
      'Warning: This operation may affect performance. Proceed with caution.',
    onAction: () => {},
    actionLabel: 'Acknowledge',
  },
}

export const WithContinue: Story = {
  args: {
    message:
      'Warning: Some constraints were not applied. You can continue with the current schema.',
    onAction: () => {},
    actionLabel: 'Continue',
  },
}

export const LongMessage: Story = {
  args: {
    message: `**Warning**: The following issues were detected during processing:
- Some columns have missing constraints
- Index performance might be suboptimal
- Foreign key relationships are not enforced

The schema generation continued despite these warnings. You may want to review and address these issues.`,
  },
}

export const WithLink: Story = {
  args: {
    message:
      'Warning: Please review the [documentation](https://example.com) for best practices.',
  },
}
