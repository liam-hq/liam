import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectHeaderView } from './ProjectHeader/ProjectHeaderView'
import { PROJECT_TAB } from './ProjectHeader/projectConstants'
import { ProjectLayoutView } from './ProjectLayoutView'

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
  component: ProjectLayoutView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    projectHeader: (
      <ProjectHeaderView
        projectId="project-1"
        branchOrCommit="main"
        project={{
          name: 'Sample Project',
          schemaPath: {
            path: 'db/schema.rb',
            format: 'schemarb',
          },
        }}
        urlgen={mockUrlgen}
      />
    ),
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Project Content</h1>
        <p>This is the main content area for the project tab.</p>
      </div>
    ),
  },
} satisfies Meta<typeof ProjectLayoutView>

export default meta
type Story = StoryObj<typeof ProjectLayoutView>

export const Default: Story = {}

export const WithoutHeader: Story = {
  args: {
    projectHeader: undefined,
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Content Without Header</h1>
        <p>The ProjectLayout can be rendered without the project header.</p>
      </div>
    ),
  },
}

export const SchemaTab: Story = {
  args: {
    defaultTabValue: PROJECT_TAB.SCHEMA,
    projectHeader: (
      <ProjectHeaderView
        projectId="project-1"
        branchOrCommit="main"
        project={{
          name: 'Sample Project',
          schemaPath: {
            path: 'db/schema.rb',
            format: 'schemarb',
          },
        }}
        urlgen={mockUrlgen}
      />
    ),
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Schema View</h1>
        <p>This is the schema tab content.</p>
        <div
          style={{
            background: '#f0f0f0',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem',
          }}
        >
          <code>db/schema.rb</code>
        </div>
      </div>
    ),
  },
}

export const SessionsTab: Story = {
  args: {
    defaultTabValue: PROJECT_TAB.SESSIONS,
    projectHeader: (
      <ProjectHeaderView
        projectId="project-1"
        branchOrCommit="main"
        project={{
          name: 'Sample Project',
          schemaPath: {
            path: 'db/schema.rb',
            format: 'schemarb',
          },
        }}
        urlgen={mockUrlgen}
      />
    ),
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Sessions</h1>
        <p>This is the sessions tab content.</p>
        <ul>
          <li>Session 1</li>
          <li>Session 2</li>
          <li>Session 3</li>
        </ul>
      </div>
    ),
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

export const WithoutSchemaPath: Story = {
  args: {
    projectHeader: (
      <ProjectHeaderView
        projectId="project-1"
        branchOrCommit="main"
        project={{
          name: 'Project Without Schema',
          schemaPath: null,
        }}
        urlgen={mockUrlgen}
      />
    ),
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Project Without Schema Configuration</h1>
        <p>
          The Schema tab is disabled when no schema path is configured for the
          project.
        </p>
      </div>
    ),
  },
}
