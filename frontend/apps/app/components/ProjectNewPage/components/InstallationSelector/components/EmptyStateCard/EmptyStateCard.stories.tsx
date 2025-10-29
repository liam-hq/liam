import type { Meta, StoryObj } from '@storybook/nextjs'
import { EmptyStateCard } from './EmptyStateCard'

const meta = {
  component: EmptyStateCard,
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
    onActionClick: {
      action: 'clicked',
      description: 'Callback when action button is clicked',
    },
    actionDisabled: {
      control: 'boolean',
      description: 'Whether the action button is disabled',
    },
    description: {
      control: 'text',
      description: 'Description text to display',
    },
    actionText: {
      control: 'text',
      description: 'Button text',
    },
  },
} satisfies Meta<typeof EmptyStateCard>

export default meta
type Story = StoryObj<typeof EmptyStateCard>

export const NoInstallations: Story = {
  args: {
    description:
      'No GitHub installations found. Please install the Liam app on your repositories.',
    actionText: 'Install Liam',
    actionDisabled: false,
  },
}

export const NoRepositories: Story = {
  args: {
    description:
      'No repositories found in your installation. Please grant access to repositories.',
    actionText: 'Configure Repositories',
    actionDisabled: false,
  },
}

export const Disabled: Story = {
  args: {
    description: 'Loading your GitHub installations...',
    actionText: 'Install Liam',
    actionDisabled: true,
  },
}
