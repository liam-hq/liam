import type { Meta, StoryObj } from '@storybook/nextjs'
import { RepositoryItem } from './RepositoryItem'

const meta = {
  component: RepositoryItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    name: {
      control: 'text',
      description: 'Repository name',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the import is in progress',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when import button is clicked',
    },
  },
} satisfies Meta<typeof RepositoryItem>

export default meta
type Story = StoryObj<typeof RepositoryItem>

export const Default: Story = {
  args: {
    name: 'acme-corp/main-app',
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    name: 'acme-corp/main-app',
    isLoading: true,
  },
}

export const LongName: Story = {
  args: {
    name: 'very-long-organization-name/very-long-repository-name',
    isLoading: false,
  },
}
