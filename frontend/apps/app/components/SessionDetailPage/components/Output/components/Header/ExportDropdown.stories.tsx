import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { ToastProvider } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/react'
import { ExportDropdown } from './ExportDropdown'

const sampleSchema = aSchema({
  tables: {
    users: aTable({
      name: 'users',
      columns: {
        id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
        email: aColumn({ name: 'email', type: 'varchar(255)', notNull: true }),
        name: aColumn({ name: 'name', type: 'varchar(100)' }),
      },
    }),
    posts: aTable({
      name: 'posts',
      columns: {
        id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
        user_id: aColumn({ name: 'user_id', type: 'bigint', notNull: true }),
        title: aColumn({ name: 'title', type: 'varchar(255)', notNull: true }),
      },
    }),
  },
})

const meta = {
  component: ExportDropdown,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    schema: {
      description: 'The database schema to export as PostgreSQL DDL',
    },
  },
} satisfies Meta<typeof ExportDropdown>

export default meta
type Story = StoryObj<typeof ExportDropdown>

export const Default: Story = {
  args: {
    schema: sampleSchema,
  },
}
