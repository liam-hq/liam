import type { Meta, StoryObj } from '@storybook/nextjs'
import { GlobalNav } from './GlobalNav'

const meta = {
  component: GlobalNav,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    currentOrganization: {
      id: 'org-1',
      name: 'Sample Organization',
    },
    organizations: [
      {
        organizations: {
          id: 'org-1',
          name: 'Sample Organization',
        },
      },
      {
        organizations: {
          id: 'org-2',
          name: 'Another Organization',
        },
      },
    ],
  },
} satisfies Meta<typeof GlobalNav>

export default meta
type Story = StoryObj<typeof GlobalNav>

export const Default: Story = {}

export const WithoutOrganization: Story = {
  args: {
    currentOrganization: null,
    organizations: null,
  },
}

export const SingleOrganization: Story = {
  args: {
    organizations: [
      {
        organizations: {
          id: 'org-1',
          name: 'Sample Organization',
        },
      },
    ],
  },
}
