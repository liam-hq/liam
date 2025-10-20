import type { Meta, StoryObj } from '@storybook/nextjs'
import type { Organization } from '../../services/getOrganization'
import type { OrganizationsByUserId } from '../../services/getOrganizationsByUserId'
import { OrganizationItem } from './OrganizationItem'

const sampleCurrentOrganization: Organization = {
  id: 'org-1',
  name: 'Acme Corporation',
}

const sampleOrganizations: OrganizationsByUserId = [
  {
    organizations: {
      id: 'org-1',
      name: 'Acme Corporation',
    },
  },
  {
    organizations: {
      id: 'org-2',
      name: 'Tech Startup Inc.',
    },
  },
  {
    organizations: {
      id: 'org-3',
      name: 'Enterprise Solutions',
    },
  },
]

const meta = {
  component: OrganizationItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '250px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    currentOrganization: {
      description: 'Currently selected organization',
    },
    organizations: {
      description: 'List of organizations the user belongs to',
    },
  },
} satisfies Meta<typeof OrganizationItem>

export default meta
type Story = StoryObj<typeof OrganizationItem>

export const Default: Story = {
  args: {
    currentOrganization: sampleCurrentOrganization,
    organizations: sampleOrganizations,
  },
}

export const SingleOrganization: Story = {
  args: {
    currentOrganization: sampleCurrentOrganization,
    organizations: [
      {
        organizations: sampleCurrentOrganization,
      },
    ],
  },
}

export const LongName: Story = {
  args: {
    currentOrganization: {
      id: 'org-4',
      name: 'Very Long Organization Name That Might Overflow',
    },
    organizations: [
      {
        organizations: {
          id: 'org-4',
          name: 'Very Long Organization Name That Might Overflow',
        },
      },
    ],
  },
}
