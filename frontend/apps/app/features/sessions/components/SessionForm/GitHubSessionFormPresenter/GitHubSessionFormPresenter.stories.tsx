import type { Meta } from '@storybook/nextjs'
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
  title: 'Features/Sessions/GitHubSessionFormPresenter',
  component: GitHubSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GitHubSessionFormPresenter>

export default meta

export const Default = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          branches={[]}
          isBranchesLoading={false}
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const WithProjects = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          defaultProjectId="1"
          branches={[]}
          isBranchesLoading={false}
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const WithBranches = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          defaultProjectId="1"
          branches={mockBranches}
          isBranchesLoading={false}
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const BranchesLoading = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          defaultProjectId="1"
          branches={[]}
          isBranchesLoading={true}
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const WithBranchesError = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          defaultProjectId="1"
          branches={[]}
          isBranchesLoading={false}
          branchesError="Failed to load branches. Please check your repository settings."
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const WithFormError = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          branches={mockBranches}
          isBranchesLoading={false}
          formError="Please enter a valid message."
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const Pending = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          branches={mockBranches}
          isBranchesLoading={false}
          isPending={true}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const EmptyProjects = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={[]}
          branches={[]}
          isBranchesLoading={false}
          isPending={false}
          onProjectChange={() => {}}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const Interactive = {
  render: () => {
    const [isPending, setIsPending] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [branches, setBranches] = useState<Branch[]>([])
    const [isBranchesLoading, setIsBranchesLoading] = useState(false)

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
      <div style={{ width: '800px' }}>
        <GitHubSessionFormPresenter
          projects={mockProjects}
          branches={branches}
          isBranchesLoading={isBranchesLoading}
          isPending={isPending}
          formAction={handleFormAction}
          onProjectChange={handleProjectChange}
          defaultProjectId={selectedProjectId}
        />
      </div>
    )
  },
}

export const InteractiveWithError = {
  render: () => {
    const [isPending, setIsPending] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [branches, setBranches] = useState<Branch[]>([])
    const [isBranchesLoading, setIsBranchesLoading] = useState(false)
    const [formError, setFormError] = useState<string | undefined>()
    const [branchesError, setBranchesError] = useState<string | undefined>()

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
          width: '800px',
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
          projects={mockProjects}
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
