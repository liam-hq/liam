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
  has_schema: false,
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
      has_schema: true,
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
      has_schema: false,
    },
  },
}
