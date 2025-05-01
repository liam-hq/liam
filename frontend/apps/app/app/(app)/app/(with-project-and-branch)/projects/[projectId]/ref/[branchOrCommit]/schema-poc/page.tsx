'use client'

import { Button } from '@/components'
import { 
  ModalRoot, 
  ModalTrigger, 
  ModalPortal, 
  ModalOverlay, 
  ModalContent, 
  ModalTitle, 
  ModalClose 
} from '@liam-hq/ui'
import { SchemaChat } from '@/features/schemas/components/SchemaChat/SchemaChat'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import type { Schema } from '@liam-hq/db-structure'
import { useState, useRef } from 'react'
import styles from './page.module.css'

const emptySchema: Schema = {
  tables: {},
  relationships: {},
  tableGroups: {},
}

export default function Page() {
  const [schema, setSchema] = useState<Schema>(emptySchema)
  const [isOpen, setIsOpen] = useState(false)

  // Function to format schema as pretty JSON
  const formatSchema = (schema: Schema): string => {
    // Clone the schema to avoid modifying the original
    const schemaClone = JSON.parse(JSON.stringify(schema))
    
    // Format the schema JSON with proper indentation
    return JSON.stringify(schemaClone, null, 2)
  }
  
  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showCopySuccess()
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
  
  // Show a temporary success message when content is copied
  const showCopySuccess = () => {
    const toast = document.createElement('div')
    toast.textContent = 'Copied to clipboard'
    toast.style.position = 'fixed'
    toast.style.bottom = '20px'
    toast.style.left = '50%'
    toast.style.transform = 'translateX(-50%)'
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    toast.style.color = 'white'
    toast.style.padding = '8px 16px'
    toast.style.borderRadius = '4px'
    toast.style.zIndex = '9999'
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 2000)
  }

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
        <div className={styles.toolbarContainer}>
          <Button onClick={handleAddTestTable}>Add Test Table</Button>
          
          <ModalRoot open={isOpen} onOpenChange={setIsOpen}>
            <ModalTrigger asChild>
              <Button variant="outline-secondary">Show Current Schema</Button>
            </ModalTrigger>
            <ModalPortal>
              <ModalOverlay />
              <ModalContent>
                <ModalTitle>Current Schema</ModalTitle>
                <div className={styles.schemaContent}>
                  {formatSchema(schema)}
                  <button 
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(formatSchema(schema))}
                  >
                    Copy
                  </button>
                </div>
                <ModalClose asChild>
                  <Button style={{ marginTop: '16px' }}>Close</Button>
                </ModalClose>
              </ModalContent>
            </ModalPortal>
          </ModalRoot>
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
