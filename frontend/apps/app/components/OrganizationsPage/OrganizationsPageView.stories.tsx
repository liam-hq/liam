import type { Meta, StoryObj } from '@storybook/nextjs'
import { OrganizationsPageView } from './OrganizationsPageView'

const meta = {
  component: OrganizationsPageView,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    showToast: {
      description: 'Show toast notification',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof OrganizationsPageView>

export default meta
type Story = StoryObj<typeof OrganizationsPageView>

export const WithOrganizations: Story = {
  name: 'With organizations',
  args: {
    organizations: [
      {
        id: 'org-1',
        name: 'Tech Company Inc',
      },
      {
        id: 'org-2',
        name: 'Design Studio',
      },
      {
        id: 'org-3',
        name: 'Startup LLC',
      },
      {
        id: 'org-4',
        name: null,
      },
    ],
    showToast: false,
  },
}

export const EmptyState: Story = {
  name: 'Empty state',
  args: {
    organizations: [],
    showToast: false,
  },
}

export const NullOrganizations: Story = {
  name: 'Null organizations',
  args: {
    organizations: null,
    showToast: false,
  },
}

export const SingleOrganization: Story = {
  name: 'Single organization',
  args: {
    organizations: [
      {
        id: 'org-1',
        name: 'My Organization',
      },
    ],
    showToast: false,
  },
}
