'use client'

import { Button } from '@/components'
import { SchemaChat } from '@/features/schemas/components/SchemaChat/SchemaChat'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import { OverrideEditor } from '@/features/schemas/pages/SchemaPage/components/OverrideEditor'
import { SchemaHeader } from '@/features/schemas/pages/SchemaPage/components/SchemaHeader'
import type { Schema } from '@liam-hq/db-structure'
import {
  ModalClose,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
  TabsContent,
  TabsRoot,
} from '@liam-hq/ui'
import { useState } from 'react'
import { DEFAULT_SCHEMA_TAB, SCHEMA_TAB } from './constants'
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
  return (
    <TabsRoot defaultValue={DEFAULT_SCHEMA_TAB} className={styles.container}>
      <SchemaHeader />
      <TabsContent value={SCHEMA_TAB.ERD} className={styles.tabsContent}>
        <div className={styles.erdContainer}>
          <div className={styles.chatPanel}>
            <SchemaChat schema={schema} onSchemaChange={handleModifySchema} />
          </div>
          <div className={styles.editorPanel}>
            <div className={styles.toolbarContainer}>
              <ModalRoot open={isOpen} onOpenChange={setIsOpen}>
                <ModalTrigger asChild>
                  <Button variant="outline-secondary">
                    Show Current Schema
                  </Button>
                </ModalTrigger>
                <ModalPortal>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalTitle>Current Schema</ModalTitle>
                    <div className={styles.schemaContent}>
                      {formatSchema(schema)}
                      <button
                        type="button"
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
      </TabsContent>
      <TabsContent value={SCHEMA_TAB.EDITOR} className={styles.tabsContent}>
        <OverrideEditor />
      </TabsContent>
    </TabsRoot>
  )
}
