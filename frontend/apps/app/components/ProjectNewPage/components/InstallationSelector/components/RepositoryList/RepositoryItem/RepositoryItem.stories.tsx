import { aRepository } from '@liam-hq/github'
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
    item: {
      control: 'object',
      description: 'GitHub repository object',
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
  args: {
    item: aRepository(),
  },
} satisfies Meta<typeof RepositoryItem>

export default meta
type Story = StoryObj<typeof RepositoryItem>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const LongName: Story = {
  args: {
    item: aRepository({
      name: 'very-long-organization-name/very-long-repository-name',
      private: true,
    }),
  },
}

export const Private: Story = {
  args: {
    item: aRepository({
      private: true,
    }),
  },
}
