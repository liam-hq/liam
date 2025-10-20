import type { Meta, StoryObj } from '@storybook/nextjs'
import { DeleteOrganizationButtonClient } from './DeleteOrganizationButtonClient'

const meta = {
  component: DeleteOrganizationButtonClient,
  argTypes: {
    organizationId: {
      control: 'text',
      description: 'The ID of the organization to delete',
    },
    organizationName: {
      control: 'text',
      description: 'The name of the organization to delete',
    },
    deleteAction: {
      action: 'deleteAction',
      description: 'Called when the delete action is confirmed',
    },
  },
} satisfies Meta<typeof DeleteOrganizationButtonClient>

export default meta
type Story = StoryObj<typeof DeleteOrganizationButtonClient>

export const Default: Story = {
  args: {
    organizationId: 'org-123',
    organizationName: 'My Organization',
    deleteAction: () => {},
  },
}

export const LongOrganizationName: Story = {
  args: {
    organizationId: 'org-456',
    organizationName: 'My Very Long Organization Name For Testing Purposes',
    deleteAction: () => {},
  },
}
