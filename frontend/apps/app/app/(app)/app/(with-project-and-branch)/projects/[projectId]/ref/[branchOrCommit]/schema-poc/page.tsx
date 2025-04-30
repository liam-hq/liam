'use client'

import { useState } from 'react'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import { sampleSchema } from './schema'
import { Button } from '@/components'
import type { Schema } from '@liam-hq/db-structure'

export default function Page() {
  const [schema, setSchema] = useState<Schema>(sampleSchema)

  const handleModifySchema = () => {
    // Create a deep copy of the schema to avoid mutating the original
    const newSchema = JSON.parse(JSON.stringify(schema)) as Schema

    // Add a new test table to demonstrate schema modification
    newSchema.tables.test_table = {
      name: 'test_table',
      columns: {
        id: {
          name: 'id',
          type: 'uuid',
          default: null,
          check: null,
          primary: false,
          unique: false,
          notNull: true,
          comment: null,
        },
        name: {
          name: 'name',
          type: 'text',
          default: null,
          check: null,
          primary: false,
          unique: false,
          notNull: true,
          comment: null,
        },
        created_at: {
          name: 'created_at',
          type: 'timestamptz',
          default: null,
          check: null,
          primary: false,
          unique: false,
          notNull: true,
          comment: null,
        },
      },
      comment: 'Test table added for schema modification demo',
      indexes: {},
      constraints: {},
    }

    setSchema(newSchema)
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', padding: '8px' }}>
        <Button onClick={handleModifySchema}>
          Add Test Table
        </Button>
      </div>
      <ERDEditor
        schema={schema}
        errorObjects={undefined}
        defaultSidebarOpen={false}
      />
    </div>
  )
}
