'use client'

import { Button } from '@/components'
import { SchemaChat } from '@/features/schemas/components/SchemaChat/SchemaChat'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import type { Schema } from '@liam-hq/db-structure'
import { useState } from 'react'
import styles from './page.module.css'

const emptySchema: Schema = {
  tables: {},
  relationships: {},
  tableGroups: {},
}

export default function Page() {
  const [schema, setSchema] = useState<Schema>(emptySchema)

  const handleModifySchema = (newSchema: Schema) => {
    // Create a deep copy of the schema to avoid mutating the original
    setSchema(JSON.parse(JSON.stringify(newSchema)) as Schema)
  }

  const handleAddTestTable = () => {
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
    <div className={styles.container}>
      <div className={styles.chatPanel}>
        <SchemaChat schema={schema} onSchemaChange={handleModifySchema} />
      </div>
      <div className={styles.editorPanel}>
        <div style={{ marginBottom: '16px', padding: '8px' }}>
          <Button onClick={handleAddTestTable}>Add Test Table</Button>
        </div>
        <ERDEditor
          schema={schema}
          errorObjects={undefined}
          defaultSidebarOpen={false}
        />
      </div>
    </div>
  )
}
