import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'

type Branch = {
  name: string
  sha: string
  protected: boolean
}

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
  { name: 'main', sha: 'abc123', protected: true },
  { name: 'develop', sha: 'def456', protected: false },
  { name: 'feature/user-auth', sha: 'ghi789', protected: false },
]

const meta = {
  component: GitHubSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => (
    <div style={{ width: '800px' }}>
      <GitHubSessionFormPresenter {...args} />
    </div>
  ),
} satisfies Meta<typeof GitHubSessionFormPresenter>

export default meta
type Story = StoryObj<typeof meta>

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
    branchesError:
      'Failed to load branches. Please check your repository settings.',
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

export const Interactive: Story = {
  args: {
    projects: mockProjects,
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    formAction: () => {},
    onProjectChange: () => {},
    defaultProjectId: '',
  },
  render: (args) => {
    const [isPending, setIsPending] = useState(args.isPending)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(
      args.defaultProjectId || '',
    )
    const [branches, setBranches] = useState<Branch[]>(args.branches)
    const [isBranchesLoading, setIsBranchesLoading] = useState(
      args.isBranchesLoading,
    )

    const handleFormAction = (_formData: FormData) => {
      setIsPending(true)

      // Simulate API call
      setTimeout(() => {
        setIsPending(false)
        alert('Form submitted successfully!')
      }, 3000)
    }

    const handleProjectChange = (projectId: string) => {
      setSelectedProjectId(projectId)

      // Simulate loading branches
      setIsBranchesLoading(true)
      setTimeout(() => {
        setBranches(mockBranches)
        setIsBranchesLoading(false)
      }, 1000)
    }

    return (
      <GitHubSessionFormPresenter
        {...args}
        branches={branches}
        isBranchesLoading={isBranchesLoading}
        isPending={isPending}
        formAction={handleFormAction}
        onProjectChange={handleProjectChange}
        defaultProjectId={selectedProjectId}
      />
    )
  },
}

export const InteractiveWithError: Story = {
  args: {
    projects: mockProjects,
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    formError: undefined,
    branchesError: undefined,
    formAction: () => {},
    onProjectChange: () => {},
    defaultProjectId: '',
  },
  render: (args) => {
    const [isPending, setIsPending] = useState(args.isPending)
    const [selectedProjectId, setSelectedProjectId] = useState<string>(
      args.defaultProjectId || '',
    )
    const [branches, setBranches] = useState<Branch[]>(args.branches)
    const [isBranchesLoading, setIsBranchesLoading] = useState(
      args.isBranchesLoading,
    )
    const [formError, setFormError] = useState<string | undefined>(
      args.formError,
    )
    const [branchesError, setBranchesError] = useState<string | undefined>(
      args.branchesError,
    )

    const handleFormAction = (formData: FormData) => {
      setIsPending(true)
      setFormError(undefined)

      // Simulate API call with error
      setTimeout(() => {
        setIsPending(false)
        // Error for empty message
        const message = formData.get('initialMessage') as string
        if (!message?.trim()) {
          setFormError('Please enter a valid message.')
        } else {
          setFormError(
            'An error occurred while processing your request. Please try again.',
          )
        }
      }, 2000)
    }

    const handleProjectChange = (projectId: string) => {
      setSelectedProjectId(projectId)
      setBranchesError(undefined)

      // Simulate loading branches with occasional error
      setIsBranchesLoading(true)
      setTimeout(() => {
        setIsBranchesLoading(false)
        // Randomly show error for demonstration
        if (Math.random() > 0.5) {
          setBranchesError(
            'Failed to load branches. Please check your repository settings.',
          )
          setBranches([])
        } else {
          setBranchesError(undefined)
          setBranches(mockBranches)
        }
      }, 1000)
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFormError('Sample form error')}
            style={{
              padding: '4px 8px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Trigger Form Error
          </button>
          <button
            type="button"
            onClick={() => setBranchesError('Sample branches error')}
            style={{
              padding: '4px 8px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Trigger Branches Error
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError(undefined)
              setBranchesError(undefined)
            }}
            style={{
              padding: '4px 8px',
              background: '#44aa44',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Errors
          </button>
        </div>
        <GitHubSessionFormPresenter
          {...args}
          branches={branches}
          isBranchesLoading={isBranchesLoading}
          isPending={isPending}
          formError={formError}
          branchesError={branchesError}
          formAction={handleFormAction}
          onProjectChange={handleProjectChange}
          defaultProjectId={selectedProjectId}
        />
      </div>
    )
  },
}
