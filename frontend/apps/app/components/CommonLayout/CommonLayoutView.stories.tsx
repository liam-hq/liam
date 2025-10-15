import type { Meta, StoryObj } from '@storybook/nextjs'
import { CommonLayoutView } from './CommonLayoutView'

const meta = {
  component: CommonLayoutView,
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
    avatarUrl: null,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Main Content Area</h1>
        <p>
          This is the main content area of the CommonLayout component. It
          includes the GlobalNav sidebar and AppBar header.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof CommonLayoutView>

export default meta
type Story = StoryObj<typeof CommonLayoutView>

export const Default: Story = {}

export const WithAvatar: Story = {
  args: {
    avatarUrl: 'https://via.placeholder.com/40',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
  },
}

export const WithProjectContext: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Project View</h1>
        <p>This is the project content area.</p>
      </div>
    ),
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

export const WithLongContent: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Long Content Example</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    ),
  },
}

export const WithoutOrganization: Story = {
  args: {
    currentOrganization: null,
    organizations: null,
  },
}
