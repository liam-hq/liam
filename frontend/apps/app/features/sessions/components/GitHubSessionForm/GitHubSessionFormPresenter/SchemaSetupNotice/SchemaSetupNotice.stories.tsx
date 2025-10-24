import type { Meta, StoryObj } from '@storybook/nextjs'
import { SchemaSetupNotice } from './SchemaSetupNotice'

const meta = {
  component: SchemaSetupNotice,
  argTypes: {
    projectId: {
      control: 'text',
      description: 'Project ID used for link generation',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SchemaSetupNotice>

export default meta
type Story = StoryObj<typeof SchemaSetupNotice>

export const Default: Story = {
  args: {
    projectId: 'proj_12345',
  },
}
