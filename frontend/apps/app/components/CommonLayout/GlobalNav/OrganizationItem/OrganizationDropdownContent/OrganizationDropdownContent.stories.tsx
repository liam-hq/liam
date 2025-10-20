import { Button, DropdownMenuRoot, DropdownMenuTrigger } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import type { Organization } from '../../../services/getOrganization'
import type { OrganizationsByUserId } from '../../../services/getOrganizationsByUserId'
import { OrganizationDropdownContent } from './OrganizationDropdownContent'

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
  component: OrganizationDropdownContent,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <DropdownMenuRoot defaultOpen={true}>
        <DropdownMenuTrigger asChild>
          <Button>Organization Menu</Button>
        </DropdownMenuTrigger>
        <Story />
      </DropdownMenuRoot>
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
} satisfies Meta<typeof OrganizationDropdownContent>

export default meta
type Story = StoryObj<typeof OrganizationDropdownContent>

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

export const ManyOrganizations: Story = {
  args: {
    currentOrganization: sampleCurrentOrganization,
    organizations: [
      ...sampleOrganizations,
      {
        organizations: {
          id: 'org-4',
          name: 'Global Services Ltd.',
        },
      },
      {
        organizations: {
          id: 'org-5',
          name: 'Innovation Hub',
        },
      },
      {
        organizations: {
          id: 'org-6',
          name: 'Digital Agency',
        },
      },
    ],
  },
}
