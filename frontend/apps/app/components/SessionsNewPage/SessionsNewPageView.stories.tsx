import type { Meta, StoryObj } from '@storybook/nextjs'
import { SessionsNewPageView } from './SessionsNewPageView'

const meta = {
  component: SessionsNewPageView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionsNewPageView>

export default meta
type Story = StoryObj<typeof SessionsNewPageView>

export const WithProjectsAndSessions: Story = {
  name: 'With projects and recent sessions',
  args: {
    projects: [
      {
        id: 'project-1',
        name: 'E-commerce Backend',
      },
      {
        id: 'project-2',
        name: 'Analytics Service',
      },
      {
        id: 'project-3',
        name: 'User Management',
      },
    ],
    recentSessions: [
      {
        id: 'session-1',
        name: 'Design User Authentication',
        created_at: '2024-03-15T10:30:00Z',
        project_id: 'project-1',
      },
      {
        id: 'session-2',
        name: 'Payment System Schema',
        created_at: '2024-03-14T14:20:00Z',
        project_id: 'project-1',
      },
      {
        id: 'session-3',
        name: 'Analytics Tables',
        created_at: '2024-03-10T09:15:00Z',
        project_id: 'project-2',
      },
    ],
  },
}

export const WithProjectsOnly: Story = {
  name: 'With projects, no sessions',
  args: {
    projects: [
      {
        id: 'project-1',
        name: 'New Project',
      },
      {
        id: 'project-2',
        name: 'Another Project',
      },
    ],
    recentSessions: [],
  },
}

export const EmptyState: Story = {
  name: 'Empty state',
  args: {
    projects: [],
    recentSessions: [],
  },
}

export const ManySessions: Story = {
  name: 'Many recent sessions',
  args: {
    projects: [
      {
        id: 'project-1',
        name: 'Main Project',
      },
    ],
    recentSessions: Array.from({ length: 8 }, (_, i) => ({
      id: `session-${i + 1}`,
      name: `Design Session ${i + 1}`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      project_id: 'project-1',
    })),
  },
}
