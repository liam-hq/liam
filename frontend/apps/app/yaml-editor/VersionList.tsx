'use client'

import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
// Import using a different syntax
import * as schemaVersionStoreModule from './schemaVersionStore'

// Use the imported type and hook
type VersionId = schemaVersionStoreModule.VersionId
const { useSchemaVersionStore } = schemaVersionStoreModule

interface VersionListProps {
  isLoading?: boolean
}

export function VersionList({ isLoading = false }: VersionListProps) {
  // Try to use schema version store first, fall back to regular version store
  const schemaStore = useSchemaVersionStore()
  
  const {
    versions,
    selectedVersionNumber: selectedVersionId,
    selectVersion,
    revertToVersion,
    undoVersion,
    redoVersion,
    updateVersionTitle,
  } = schemaStore
  
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingTitleId, setEditingTitleId] = useState<VersionId | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState<string>('')

  // Scroll to the bottom when versions change
  useEffect(() => {
    if (containerRef.current && versions.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [versions])

  const handleRevert = (id: VersionId) => {
    revertToVersion(id)
    toast({
      title: 'Version Reverted',
      description: `Successfully reverted to version ${id}`,
    })
  }

  const handleUndo = (id: VersionId) => {
    undoVersion(id)
    toast({
      title: 'Changes Undone',
      description: `Successfully undid changes from version ${id}`,
    })
  }

  const handleRedo = (id: VersionId) => {
    redoVersion(id)
    toast({
      title: 'Changes Redone',
      description: `Successfully redone changes from version ${id}`,
    })
  }

  return (
    <div className="h-full flex flex-col yaml-editor-content">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Version History</h2>
        <p className="text-sm mt-1">
          {versions.length === 0
            ? 'No versions saved yet'
            : `${versions.length} version${versions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto yaml-editor-scroll"
      >
        {versions.length === 0 ? (
          <div className="p-4 text-center">
            <p>No versions saved yet.</p>
            <p className="text-sm mt-2">
              Edit the YAML and click Save to create your first version.
            </p>
          </div>
        ) : (
          <ul>
            {[...versions].reverse().map((version) => (
              <li
                key={version.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedVersionId === version.number ? 'border-l-4' : ''
                }`}
                style={{
                  backgroundColor:
                    selectedVersionId === version.number
                      ? '#37373d'
                      : 'transparent',
                  borderLeftColor:
                    selectedVersionId === version.number
                      ? '#0e639c'
                      : 'transparent',
                  paddingLeft:
                    selectedVersionId === version.number ? '12px' : '16px',
                  borderBottom: '1px solid #3e3e42',
                }}
                onClick={() => selectVersion(version.number)}
              >
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="version-badge">
                          Version {version.number}
                        </span>
                        {version.id === versions[0].id && (
                          <span className="latest-badge">latest</span>
                        )}
                      </div>

                      {editingTitleId === version.number ? (
                        <div className="mt-1 flex items-center">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) =>
                              setEditingTitleValue(e.target.value)
                            }
                            className="text-sm rounded px-2 py-1 w-full"
                            style={{
                              border: '1px solid #3e3e42',
                              backgroundColor: '#1e1e1e',
                              color: '#e0e0e0',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateVersionTitle(
                                  version.number,
                                  editingTitleValue,
                                )
                                setEditingTitleId(null)
                                e.stopPropagation()
                              } else if (e.key === 'Escape') {
                                setEditingTitleId(null)
                                e.stopPropagation()
                              }
                            }}
                          />
                          <button
                            className="ml-1 px-2 py-1 text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateVersionTitle(version.number, editingTitleValue)
                              setEditingTitleId(null)
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          className="mt-1 text-sm cursor-pointer"
                          style={{ color: '#e0e0e0' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTitleId(version.number)
                            setEditingTitleValue(version.title)
                          }}
                        >
                          {version.title}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-1">
                      {/* Show "Revert to this" button for all versions except the latest */}
                      {version.id !== versions[0].id && (
                        <button
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRevert(version.number)
                          }}
                        >
                          Revert to this
                        </button>
                      )}

                      {/* Show "Undo" button for all versions except the first one (Version 1) */}
                      {version.number !== 1 && (
                        <button
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUndo(version.number)
                          }}
                        >
                          Undo
                        </button>
                      )}

                      {/* Redo button - hidden for Version 1 */}
                      {version.number !== 1 && (
                        <button
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRedo(version.number)
                          }}
                        >
                          Redo
                        </button>
                      )}
                    </div>
                  </div>

                  {(version.patch || version.reversePatch) && (
                    <details className="mt-2">
                      <summary
                        className="text-sm cursor-pointer"
                        style={{ color: '#858585' }}
                      >
                        Patch details
                      </summary>
                      <div
                        className="mt-1 p-2 rounded"
                        style={{ backgroundColor: '#252526' }}
                      >
                        {version.patch && (
                          <div>
                            <h4
                              className="text-xs font-medium mb-1"
                              style={{ color: '#e0e0e0' }}
                            >
                              Forward Patch:
                            </h4>
                            <pre
                              className="text-sm overflow-auto"
                              style={{
                                color: '#e0e0e0',
                                fontFamily:
                                  "'Menlo', 'Monaco', 'Courier New', monospace",
                              }}
                            >
                              {JSON.stringify(version.patch, null, 2)}
                            </pre>
                          </div>
                        )}

                        {version.reversePatch && (
                          <div className="mt-3">
                            <h4
                              className="text-xs font-medium mb-1"
                              style={{ color: '#e0e0e0' }}
                            >
                              Reverse Patch:
                            </h4>
                            <pre
                              className="text-sm overflow-auto"
                              style={{
                                color: '#e0e0e0',
                                fontFamily:
                                  "'Menlo', 'Monaco', 'Courier New', monospace",
                              }}
                            >
                              {JSON.stringify(version.reversePatch, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
