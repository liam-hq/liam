import type { Meta, StoryObj } from '@storybook/nextjs'
import type { ComponentProps } from 'react'
import type { Projects } from '../../../../../components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'

const mockProjects: Projects = [
  {
    id: '1',
    name: 'E-commerce Platform',
  },
  {
    id: '2',
    name: 'Blog System',
  },
  {
    id: '3',
    name: 'User Management',
  },
]

const mockBranches = [
  { name: 'main', sha: 'abc123', isProduction: true },
  { name: 'develop', sha: 'def456', isProduction: false },
  { name: 'feature/user-auth', sha: 'ghi789', isProduction: false },
]

const meta = {
  component: GitHubSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    projects: mockProjects,
    branches: mockBranches,
    isBranchesLoading: false,
    isPending: false,
    schemaFilePath: 'schema.rb',
    onProjectChange: () => {},
    formAction: () => {},
  },
  render: (args: ComponentProps<typeof GitHubSessionFormPresenter>) => (
    <div style={{ width: '800px' }}>
      <GitHubSessionFormPresenter {...args} />
    </div>
  ),
} satisfies Meta<typeof GitHubSessionFormPresenter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedProject: Story = {
  args: {
    defaultProjectId: '1',
  },
}

export const WithBranches: Story = {
  args: {
    defaultProjectId: '1',
    branches: mockBranches,
  },
}

export const BranchesLoading: Story = {
  args: {
    defaultProjectId: '1',
    isBranchesLoading: true,
  },
}

export const NoSchemaConfigured: Story = {
  args: {
    schemaFilePath: null,
  },
}

export const WithBranchesError: Story = {
  args: {
    defaultProjectId: '1',
    branches: mockBranches,
    isBranchesError: true,
  },
}

export const WithFormError: Story = {
  args: {
    formError: 'Please enter a valid message.',
  },
}

export const Pending: Story = {
  args: {
    isPending: true,
  },
}

export const EmptyProjects: Story = {
  args: {
    projects: [],
  },
}

export const UnsetSchemaFilePath: Story = {
  args: {
    defaultProjectId: '1',
    isSchemaPathLoading: false,
    schemaFilePath: null,
  },
}
