import type { Schema } from '@liam-hq/schema'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { PublicSessionDetailPageView } from './PublicSessionDetailPageView'

const meta = {
  component: PublicSessionDetailPageView,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    buildingSchemaId: {
      description: 'Building schema ID',
      control: 'text',
    },
    designSessionId: {
      description: 'Design session ID',
      control: 'text',
    },
  },
} satisfies Meta<typeof PublicSessionDetailPageView>

export default meta
type Story = StoryObj<typeof PublicSessionDetailPageView>

const mockSchema: Schema = {
  tables: {
    users: {
      name: 'users',
      comment: 'User accounts table',
      columns: {
        id: {
          name: 'id',
          type: 'uuid',
          default: null,
          check: null,
          notNull: true,
          comment: 'Primary key',
        },
        email: {
          name: 'email',
          type: 'text',
          default: null,
          check: null,
          notNull: true,
          comment: 'User email address',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp',
          default: null,
          check: null,
          notNull: true,
          comment: 'Creation timestamp',
        },
      },
      indexes: {},
      constraints: {},
    },
  },
  enums: {},
  extensions: {},
}

const mockVersions = [
  {
    id: 'version-1',
    number: 1,
    created_at: '2024-03-15T10:00:00Z',
    building_schema_id: 'schema-1',
    patch: {},
    reverse_patch: {},
  },
]

export const Default: Story = {
  name: 'Default',
  args: {
    buildingSchemaId: 'schema-123',
    designSessionId: 'session-123',
    initialSchema: mockSchema,
    initialPrevSchema: mockSchema,
    initialVersions: mockVersions,
    initialAnalyzedRequirements: null,
  },
}
