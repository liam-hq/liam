import { aRepository } from '@liam-hq/github'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { RepositoryList } from './RepositoryList'

const meta = {
  component: RepositoryList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '450px', height: '300px', overflowY: 'scroll' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    repositories: {
      control: 'object',
      description: 'Array of GitHub repository objects',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    isAddingProject: {
      control: 'boolean',
      description: 'Whether a project is being added',
    },
    hasSelectedInstallation: {
      control: 'boolean',
      description: 'Whether an installation has been selected',
    },
    onSelectRepository: {
      action: 'selected',
      description: 'Callback when a repository is selected',
    },
  },
  args: {
    repositories: [
      aRepository(),
      aRepository({
        id: 123456790,
        name: 'another-repo',
        full_name: 'test-owner/another-repo',
        description: 'Another test repository',
      }),
      aRepository({
        id: 123456791,
        name: 'private-repo',
        full_name: 'test-owner/private-repo',
        description: 'A private repository',
        private: true,
      }),
    ],
    isAddingProject: false,
    hasSelectedInstallation: true,
  },
} satisfies Meta<typeof RepositoryList>

export default meta
type Story = StoryObj<typeof RepositoryList>

export const Default: Story = {}

export const SingleRepository: Story = {
  args: {
    repositories: [aRepository()],
  },
}

export const ManyRepositories: Story = {
  args: {
    repositories: Array.from({ length: 10 }, (_, i) =>
      aRepository({
        id: 123456789 + i,
        name: `repo-${i + 1}`,
        full_name: `test-owner/repo-${i + 1}`,
        description: `Test repository number ${i + 1}`,
        private: i % 3 === 0,
      }),
    ),
  },
}
