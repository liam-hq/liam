'use client'

import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
// Import using a different syntax
import * as schemaVersionStoreModule from './schemaVersionStore'

// Use the imported hook
const { useSchemaVersionStore } = schemaVersionStoreModule

// Fallback textarea component while Monaco loads or for SSR
function TextareaEditor({
  value,
  onChange,
}: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      className="yaml-editor-container"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="Enter YAML here..."
      style={{
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      }}
    />
  )
}

// Dynamically import Monaco Editor with no SSR
const MonacoEditor = dynamic(() => import('./MonacoEditorWrapper'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#858585' }} />
    </div>
  ),
})

interface YamlEditorProps {
  isLoading?: boolean
}

export function YamlEditor({ isLoading = false }: YamlEditorProps) {
  // Try to use schema version store first, fall back to regular version store
  const schemaStore = useSchemaVersionStore()
  
  const {
    currentYaml,
    updateCurrentYaml,
    saveVersion,
    hasUnsavedChanges,
    selectedVersionNumber: selectedVersionId,
    versions,
  } = schemaStore
  
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSave = async () => {
    try {
      await saveVersion()
      toast({
        title: 'Version Saved',
        description: 'Your changes have been saved as a new version',
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Error Saving Version',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="h-full flex flex-col yaml-editor-content">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">YAML Editor</h2>
          {selectedVersionId && (
            <div className="ml-2 flex items-center">
              <span className="version-badge">Version {selectedVersionId}</span>
              {versions.length > 0 && selectedVersionId === versions[0].number && (
                <span className="latest-badge">latest</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm" style={{ color: '#f59e0b' }}>
              Unsaved changes
            </span>
          )}
          <button onClick={handleSave} disabled={!isClient || isLoading}>
            {!isClient || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Save Version'
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden yaml-editor-scroll">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#858585' }} />
            <span className="ml-2">Loading schema data...</span>
          </div>
        ) : isClient ? (
          <MonacoEditor value={currentYaml} onChange={updateCurrentYaml} />
        ) : (
          <TextareaEditor value={currentYaml} onChange={updateCurrentYaml} />
        )}
      </div>
    </div>
  )
}
