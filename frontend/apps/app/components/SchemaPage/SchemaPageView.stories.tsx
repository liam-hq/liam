import type { Schema } from '@liam-hq/schema'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { SchemaPageView } from './SchemaPageView'

const meta = {
  component: SchemaPageView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SchemaPageView>

export default meta
type Story = StoryObj<typeof SchemaPageView>

const mockSchema: Schema = {
  tables: {
    users: {
      name: 'users',
      comment: null,
      columns: {
        id: {
          name: 'id',
          type: 'uuid',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
        email: {
          name: 'email',
          type: 'text',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
      },
      indexes: {},
      constraints: {},
    },
    posts: {
      name: 'posts',
      comment: null,
      columns: {
        id: {
          name: 'id',
          type: 'uuid',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
        user_id: {
          name: 'user_id',
          type: 'uuid',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
        title: {
          name: 'title',
          type: 'text',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
        content: {
          name: 'content',
          type: 'text',
          default: null,
          check: null,
          notNull: false,
          comment: null,
        },
      },
      indexes: {},
      constraints: {},
    },
  },
  enums: {},
  extensions: {},
}

export const WithSchemaHeader: Story = {
  name: 'With schema header',
  args: {
    erdEditorProps: {
      schema: mockSchema,
      defaultSidebarOpen: true,
      defaultPanelSizes: [20, 80],
      errorObjects: [],
      projectId: 'project-123',
      branchOrCommit: 'main',
    },
    schemaHeader: {
      schemaName: 'schema.rb',
      format: 'schemarb',
      href: 'https://github.com/my-org/my-repo/blob/main/db/schema.rb',
    },
  },
}

export const WithoutSchemaHeader: Story = {
  name: 'Without schema header',
  args: {
    erdEditorProps: {
      schema: mockSchema,
      defaultSidebarOpen: false,
      defaultPanelSizes: [20, 80],
      errorObjects: [],
      projectId: 'project-456',
      branchOrCommit: 'develop',
    },
    schemaHeader: null,
  },
}

export const WithErrors: Story = {
  name: 'With parsing errors',
  args: {
    erdEditorProps: {
      schema: { tables: {}, enums: {}, extensions: {} },
      defaultSidebarOpen: true,
      defaultPanelSizes: [20, 80],
      errorObjects: [
        {
          name: 'ParseError',
          message: 'Failed to parse schema file',
          instruction: 'Please check the syntax of your schema file.',
        },
        {
          name: 'ValidationError',
          message: 'Invalid column type',
          instruction: 'Column types must be valid PostgreSQL types.',
        },
      ],
      projectId: 'project-789',
      branchOrCommit: 'main',
    },
    schemaHeader: {
      schemaName: 'schema.sql',
      format: 'postgres',
      href: 'https://github.com/my-org/my-repo/blob/main/schema.sql',
    },
  },
}
