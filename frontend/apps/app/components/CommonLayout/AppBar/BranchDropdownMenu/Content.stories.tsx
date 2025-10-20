import type { GitHubBranch } from '@liam-hq/github'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Content } from './Content'

const sampleBranches: GitHubBranch[] = [
  {
    name: 'main',
    sha: '123abc',
    isProduction: true,
  },
  {
    name: 'develop',
    sha: '456def',
    isProduction: false,
  },
  {
    name: 'feature/user-authentication',
    sha: '789ghi',
    isProduction: false,
  },
  {
    name: 'feature/database-migration',
    sha: '012jkl',
    isProduction: false,
  },
]

const meta = {
  component: Content,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    branches: {
      description: 'List of available branches',
    },
    currentBranchName: {
      control: 'text',
      description: 'Name of the currently selected branch',
    },
    currentProjectId: {
      control: 'text',
      description: 'ID of the current project',
    },
  },
} satisfies Meta<typeof Content>

export default meta
type Story = StoryObj<typeof Content>

export const Default: Story = {
  args: {
    branches: sampleBranches,
    currentBranchName: 'main',
    currentProjectId: 'project-123',
  },
}

export const FeatureBranch: Story = {
  args: {
    branches: sampleBranches,
    currentBranchName: 'feature/user-authentication',
    currentProjectId: 'project-123',
  },
}

export const MultipleBranches: Story = {
  args: {
    branches: [
      ...sampleBranches,
      { name: 'hotfix/critical-bug', sha: 'abc123', isProduction: false },
      { name: 'release/v1.0.0', sha: 'def456', isProduction: true },
      { name: 'feature/new-ui', sha: 'ghi789', isProduction: false },
    ],
    currentBranchName: 'develop',
    currentProjectId: 'project-123',
  },
}
