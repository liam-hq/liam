import type { Meta, StoryObj } from '@storybook/react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'

type Branch = {
  name: string
  sha: string
  protected: boolean
}

type GitHubSessionFormPresenterProps = {
  projects: Projects
  defaultProjectId?: string
  branches: Branch[]
  isBranchesLoading: boolean
  branchesError?: string
  formError?: string
  isPending: boolean
  onProjectChange: (projectId: string) => void
  formAction: (formData: FormData) => void
}

const mockProjects = [
  { id: '1', name: 'E-commerce Platform' },
  { id: '2', name: 'Blog System' },
  { id: '3', name: 'User Management' },
]

const mockBranches = [
  { name: 'main', sha: 'abc123', protected: true },
  { name: 'develop', sha: 'def456', protected: false },
  { name: 'feature/user-auth', sha: 'ghi789', protected: false },
]

const meta: Meta<GitHubSessionFormPresenterProps> = {
  title: 'Features/Sessions/GitHubSessionFormPresenter',
  component: GitHubSessionFormPresenter,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<GitHubSessionFormPresenterProps>

export const Default: Story = {
  args: {
    projects: mockProjects,
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const WithProjects: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const WithBranches: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: mockBranches,
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const BranchesLoading: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: [],
    isBranchesLoading: true,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const WithBranchesError: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: [],
    isBranchesLoading: false,
    branchesError: 'Failed to load branches. Please try again.',
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const WithFormError: Story = {
  args: {
    projects: mockProjects,
    branches: mockBranches,
    isBranchesLoading: false,
    formError: 'Please enter a valid message.',
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const Pending: Story = {
  args: {
    projects: mockProjects,
    branches: mockBranches,
    isBranchesLoading: false,
    isPending: true,
    onProjectChange: () => {},
    formAction: () => {},
  },
}

export const EmptyProjects: Story = {
  args: {
    projects: [],
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
  },
}
