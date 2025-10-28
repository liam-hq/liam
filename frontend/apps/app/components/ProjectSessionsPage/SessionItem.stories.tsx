import type { Meta, StoryObj } from '@storybook/nextjs'
import { SessionItem } from './SessionItem'
import type { ProjectSession } from './services/fetchProjectSessions'

const meta = {
  component: SessionItem,
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
    session: {
      description: 'Session data',
    },
  },
} satisfies Meta<typeof SessionItem>

export default meta
type Story = StoryObj<typeof SessionItem>

const sampleSession: ProjectSession = {
  id: 'session-1',
  name: 'Database Schema Design',
  created_at: '2024-01-15T10:30:00Z',
  project_id: 'project-123',
  organization_id: 'org-1',
  has_schema: false,
  status: 'success',
  latest_run_id: null,
}

export const Default: Story = {
  args: {
    session: sampleSession,
  },
}

export const RecentSession: Story = {
  args: {
    session: {
      id: 'session-2',
      name: 'User Authentication Flow',
      created_at: new Date().toISOString(),
      project_id: 'project-123',
      organization_id: 'org-1',
      has_schema: true,
      status: 'pending',
      latest_run_id: null,
    },
  },
}

export const LongName: Story = {
  args: {
    session: {
      id: 'session-3',
      name: 'Very Long Session Name That Might Need Truncation or Wrapping',
      created_at: '2024-02-20T14:45:00Z',
      project_id: 'project-123',
      organization_id: 'org-1',
      has_schema: false,
      status: 'success',
      latest_run_id: null,
    },
  },
}

export const ErrorState: Story = {
  args: {
    session: {
      id: 'session-4',
      name: 'Schema Generation Failure',
      created_at: '2024-02-21T09:15:00Z',
      project_id: 'project-123',
      organization_id: 'org-1',
      has_schema: false,
      status: 'error',
      latest_run_id: null,
    },
  },
}
