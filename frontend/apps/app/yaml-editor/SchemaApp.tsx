'use client'

import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { VersionListWrapper } from './VersionListWrapper'
import { YamlEditorWrapper } from './YamlEditorWrapper'
import styles from './YamlEditor.module.css'
// Try a different import syntax
import * as schemaVersionStoreModule from './schemaVersionStore'
const { useSchemaVersionStore } = schemaVersionStoreModule

interface SchemaAppProps {
  schemaId: string
}

// Make sure to export the component properly
export function SchemaApp({ schemaId }: SchemaAppProps) {
  const { initializeStore, generateFirstVersion, loadVersions } = useSchemaVersionStore()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadSchema = async () => {
      setIsLoading(true)
      try {
        // Initialize the store with the schema ID
        initializeStore(schemaId)
        
        // First try to load existing versions
        await loadVersions()
        
        // If no versions exist, generate the first version
        const { versions } = useSchemaVersionStore.getState()
        if (versions.length === 0) {
          await generateFirstVersion()
          // After generating the first version, reload the versions
          await loadVersions()
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading schema:', error)
        toast({
          title: 'Error Loading Schema',
          description: 'Failed to load schema data. Please try again.',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    }

    loadSchema()
  }, [schemaId, initializeStore, loadVersions, toast])

  return (
    <div className={styles.containerInContent} data-theme={theme}>
      <div className={styles.editorContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Version History</h2>
          </div>
          <VersionListWrapper isLoading={isLoading} schemaId={schemaId} />
        </div>
        <div className={styles.editor}>
          <YamlEditorWrapper isLoading={isLoading} schemaId={schemaId} />
        </div>
      </div>

      <Toaster />
    </div>
  )
}
