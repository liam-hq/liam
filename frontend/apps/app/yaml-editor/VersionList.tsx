'use client'

import { useToast } from '@/components/ui/use-toast'
import { useEffect, useRef, useState } from 'react'
import { useVersionStore } from './versionStore'

export function VersionList() {
  const {
    versions,
    selectedVersionId,
    selectVersion,
    revertToVersion,
    undoVersion,
    redoVersion,
    updateVersionTitle,
  } = useVersionStore()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState<string>('')

  // Scroll to the bottom when versions change
  useEffect(() => {
    if (containerRef.current && versions.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [versions])

  const handleRevert = (id: number) => {
    revertToVersion(id)
    toast({
      title: 'Version Reverted',
      description: `Successfully reverted to version ${id}`,
    })
  }

  const handleUndo = (id: number) => {
    undoVersion(id)
    toast({
      title: 'Changes Undone',
      description: `Successfully undid changes from version ${id}`,
    })
  }

  const handleRedo = (id: number) => {
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
                  selectedVersionId === version.id ? 'border-l-4' : ''
                }`}
                style={{
                  backgroundColor:
                    selectedVersionId === version.id
                      ? '#37373d'
                      : 'transparent',
                  borderLeftColor:
                    selectedVersionId === version.id
                      ? '#0e639c'
                      : 'transparent',
                  paddingLeft:
                    selectedVersionId === version.id ? '12px' : '16px',
                  borderBottom: '1px solid #3e3e42',
                }}
                onClick={() => selectVersion(version.id)}
              >
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="version-badge">
                          Version {version.id}
                        </span>
                        {version.id === versions[0].id && (
                          <span className="latest-badge">latest</span>
                        )}
                      </div>

                      {editingTitleId === version.id ? (
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
                                  version.id,
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
                              updateVersionTitle(version.id, editingTitleValue)
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
                            setEditingTitleId(version.id)
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
                            handleRevert(version.id)
                          }}
                        >
                          Revert to this
                        </button>
                      )}

                      {/* Show "Undo" button for all versions except the first one (Version 1) */}
                      {version.id !== 1 && (
                        <button
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUndo(version.id)
                          }}
                        >
                          Undo
                        </button>
                      )}

                      {/* Redo button - hidden for Version 1 */}
                      {version.id !== 1 && (
                        <button
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRedo(version.id)
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
