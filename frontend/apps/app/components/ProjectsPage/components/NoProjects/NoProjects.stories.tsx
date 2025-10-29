import type { Meta, StoryObj } from '@storybook/nextjs'
import { NoProjects } from './NoProjects'

const meta = {
  component: NoProjects,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    createProjectHref: '/organizations/new',
  },
} satisfies Meta<typeof NoProjects>

export default meta
type Story = StoryObj<typeof NoProjects>

export const Default: Story = {}
