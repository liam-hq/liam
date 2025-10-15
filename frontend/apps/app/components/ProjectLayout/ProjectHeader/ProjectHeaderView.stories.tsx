import { TabsRoot } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectHeaderView } from './ProjectHeaderView'
import { PROJECT_TAB } from './projectConstants'

const mockUrlgen = (
  route: string,
  params: Record<string, string | string[]>,
) => {
  let path = route
  for (const [key, value] of Object.entries(params)) {
    const paramValue = Array.isArray(value) ? value.join('/') : value
    path = path
      .replace(`[${key}]`, paramValue)
      .replace(`[...${key}]`, paramValue)
  }
  return path
}

const meta = {
  component: ProjectHeaderView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    projectId: 'project-1',
    branchOrCommit: 'main',
    project: {
      name: 'Sample Project',
      schemaPath: {
        path: 'db/schema.rb',
        format: 'schemarb',
      },
    },
    urlgen: mockUrlgen,
  },
  render: (args) => (
    <TabsRoot defaultValue={PROJECT_TAB.PROJECT}>
      <ProjectHeaderView {...args} />
    </TabsRoot>
  ),
} satisfies Meta<typeof ProjectHeaderView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutSchemaPath: Story = {
  args: {
    project: {
      name: 'Project Without Schema',
      schemaPath: null,
    },
  },
}

export const WithPrismaSchema: Story = {
  args: {
    project: {
      name: 'Prisma Project',
      schemaPath: {
        path: 'prisma/schema.prisma',
        format: 'prisma',
      },
    },
  },
}

export const WithPostgresSchema: Story = {
  args: {
    project: {
      name: 'PostgreSQL Project',
      schemaPath: {
        path: 'schema.sql',
        format: 'postgres',
      },
    },
  },
}

export const WithLongBranchName: Story = {
  args: {
    branchOrCommit: 'feature/very-long-branch-name-for-testing-layout',
    project: {
      name: 'Long Name Project',
      schemaPath: {
        path: 'db/schema.rb',
        format: 'schemarb',
      },
    },
  },
}
