/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectsPageView } from './ProjectsPageView'
import type { ProjectWithLastCommit } from './types'

const meta = {
  component: ProjectsPageView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ProjectsPageView>

export default meta
type Story = StoryObj<typeof ProjectsPageView>

export const WithProjects: Story = {
  name: 'With projects',
  args: {
    currentOrganization: {
      id: 'org-123',
      name: 'Sample Organization',
    },
    projects: [
      {
        id: 'project-1',
        name: 'E-commerce Platform',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-03-15T14:30:00Z',
        lastCommitDate: '2024-03-15T14:30:00Z',
        organization_id: 'org-123',
        project_repository_mappings: [
          {
            repository: {
              id: '1',
              github_installation_identifier: 1,
              github_repository_identifier: 1001,
              organization_id: 'org-123',
              owner: 'my-org',
              name: 'ecommerce-backend',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-03-15T14:30:00Z',
            },
          },
        ] as unknown as ProjectWithLastCommit['project_repository_mappings'],
      } as ProjectWithLastCommit,
      {
        id: 'project-2',
        name: 'Analytics Dashboard',
        created_at: '2024-02-01T09:15:00Z',
        updated_at: '2024-03-10T11:20:00Z',
        lastCommitDate: '2024-03-10T11:20:00Z',
        organization_id: 'org-123',
        project_repository_mappings: [
          {
            repository: {
              id: '2',
              github_installation_identifier: 2,
              github_repository_identifier: 1002,
              organization_id: 'org-123',
              owner: 'my-org',
              name: 'analytics-api',
              created_at: '2024-02-01T09:15:00Z',
              updated_at: '2024-03-10T11:20:00Z',
            },
          },
        ] as unknown as ProjectWithLastCommit['project_repository_mappings'],
      } as ProjectWithLastCommit,
      {
        id: 'project-3',
        name: 'User Management',
        created_at: '2024-02-20T13:45:00Z',
        updated_at: '2024-03-05T16:10:00Z',
        lastCommitDate: '2024-03-05T16:10:00Z',
        organization_id: 'org-123',
        project_repository_mappings:
          [] as ProjectWithLastCommit['project_repository_mappings'],
      } as ProjectWithLastCommit,
    ],
  },
}

export const EmptyState: Story = {
  name: 'Empty state (null)',
  args: {
    currentOrganization: {
      id: 'org-456',
      name: 'New Organization',
    },
    projects: null,
  },
}

export const NoProjects: Story = {
  name: 'No projects',
  args: {
    currentOrganization: {
      id: 'org-789',
      name: 'Another Organization',
    },
    projects: [],
  },
}

export const SingleProject: Story = {
  name: 'Single project',
  args: {
    currentOrganization: {
      id: 'org-999',
      name: 'My Organization',
    },
    projects: [
      {
        id: 'project-1',
        name: 'Main Application',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-03-15T14:30:00Z',
        lastCommitDate: '2024-03-15T14:30:00Z',
        organization_id: 'org-999',
        project_repository_mappings: [
          {
            repository: {
              id: '1',
              github_installation_identifier: 1,
              github_repository_identifier: 1003,
              organization_id: 'org-999',
              owner: 'my-org',
              name: 'main-app',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-03-15T14:30:00Z',
            },
          },
        ] as unknown as ProjectWithLastCommit['project_repository_mappings'],
      } as ProjectWithLastCommit,
    ],
  },
}
