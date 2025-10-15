import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectSessionsPageView } from './ProjectSessionsPageView'

const meta = {
  component: ProjectSessionsPageView,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    projectId: {
      description: 'Project ID',
      control: 'text',
    },
  },
} satisfies Meta<typeof ProjectSessionsPageView>

export default meta
type Story = StoryObj<typeof ProjectSessionsPageView>

export const WithSessions: Story = {
  name: 'With sessions',
  args: {
    projectId: 'project-123',
    projects: [
      {
        id: 'project-123',
        name: 'Main Project',
      },
      {
        id: 'project-456',
        name: 'Another Project',
      },
    ],
    sessions: [
      {
        id: 'session-1',
        name: 'Initial Database Design',
        created_at: '2024-03-15T10:30:00Z',
        project_id: 'project-123',
      },
      {
        id: 'session-2',
        name: 'User Authentication Schema',
        created_at: '2024-03-14T14:20:00Z',
        project_id: 'project-123',
      },
      {
        id: 'session-3',
        name: 'Payment System Tables',
        created_at: '2024-03-10T09:15:00Z',
        project_id: 'project-123',
      },
    ],
  },
}

export const EmptyState: Story = {
  name: 'Empty state (no sessions)',
  args: {
    projectId: 'project-123',
    projects: [
      {
        id: 'project-123',
        name: 'Main Project',
      },
    ],
    sessions: [],
  },
}

export const ManySessions: Story = {
  name: 'Many sessions',
  args: {
    projectId: 'project-123',
    projects: [
      {
        id: 'project-123',
        name: 'Main Project',
      },
    ],
    sessions: Array.from({ length: 10 }, (_, i) => ({
      id: `session-${i + 1}`,
      name: `Design Session ${i + 1}`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      project_id: 'project-123',
    })),
  },
}
