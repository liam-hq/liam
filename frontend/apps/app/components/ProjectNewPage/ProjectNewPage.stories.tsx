/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Installation } from '@liam-hq/github'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectNewPage } from './ProjectNewPage'

const meta = {
  component: ProjectNewPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    organizationId: {
      description: 'Organization ID',
      control: 'text',
    },
  },
} satisfies Meta<typeof ProjectNewPage>

export default meta
type Story = StoryObj<typeof ProjectNewPage>

export const WithInstallations: Story = {
  name: 'With installations',
  args: {
    organizationId: 'org-123',
    installations: [
      {
        id: 1,
        account: {
          login: 'my-org',
        },
        app_slug: 'liam-db',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        suspended_at: null,
      } as Installation,
      {
        id: 2,
        account: {
          login: 'another-org',
        },
        app_slug: 'liam-db',
        created_at: '2024-02-20T14:30:00Z',
        updated_at: '2024-02-20T14:30:00Z',
        suspended_at: null,
      } as Installation,
    ],
  },
}

export const EmptyInstallations: Story = {
  name: 'Empty installations',
  args: {
    organizationId: 'org-456',
    installations: [],
  },
}

export const SingleInstallation: Story = {
  name: 'Single installation',
  args: {
    organizationId: 'org-789',
    installations: [
      {
        id: 1,
        account: {
          login: 'my-personal',
        },
        app_slug: 'liam-db',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        suspended_at: null,
      } as Installation,
    ],
  },
}
