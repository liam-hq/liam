import { Button, DropdownMenuRoot, DropdownMenuTrigger } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Content } from './Content'
import type { Project } from './services/getProject'
import type { Projects } from './services/getProjects'

const sampleCurrentProject: Project = {
  id: 'project-1',
  name: 'Main Application',
}

const sampleProjects: Projects = [
  {
    id: 'project-1',
    name: 'Main Application',
  },
  {
    id: 'project-2',
    name: 'API Service',
  },
  {
    id: 'project-3',
    name: 'Mobile App',
  },
  {
    id: 'project-4',
    name: 'Admin Dashboard',
  },
]

const meta = {
  component: Content,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <DropdownMenuRoot defaultOpen={true}>
        <DropdownMenuTrigger asChild>
          <Button>Projects Menu</Button>
        </DropdownMenuTrigger>
        <Story />
      </DropdownMenuRoot>
    ),
  ],
  argTypes: {
    currentProject: {
      description: 'Currently selected project',
    },
    projects: {
      description: 'List of all available projects',
    },
  },
} satisfies Meta<typeof Content>

export default meta
type Story = StoryObj<typeof Content>

export const Default: Story = {
  args: {
    currentProject: sampleCurrentProject,
    projects: sampleProjects,
  },
}

export const SingleProject: Story = {
  args: {
    currentProject: sampleCurrentProject,
    projects: [sampleCurrentProject],
  },
}

export const ManyProjects: Story = {
  args: {
    currentProject: sampleCurrentProject,
    projects: [
      ...sampleProjects,
      { id: 'project-5', name: 'Documentation Site' },
      { id: 'project-6', name: 'Testing Framework' },
      { id: 'project-7', name: 'CI/CD Pipeline' },
      { id: 'project-8', name: 'Monitoring Dashboard' },
    ],
  },
}
