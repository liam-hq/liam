"use client"

import { useVersionStore } from "./versionStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef, useState } from "react"

export function VersionList() {
  const { versions, selectedVersionId, selectVersion, revertToVersion, undoVersion, redoVersion, updateVersionTitle } = useVersionStore()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState<string>("")

  // Scroll to the bottom when versions change
  useEffect(() => {
    if (containerRef.current && versions.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [versions])

  const handleRevert = (id: number) => {
    revertToVersion(id)
    toast({
      title: "Version Reverted",
      description: `Successfully reverted to version ${id}`,
    })
  }
  
  const handleUndo = (id: number) => {
    undoVersion(id)
    toast({
      title: "Changes Undone",
      description: `Successfully undid changes from version ${id}`,
    })
  }
  
  const handleRedo = (id: number) => {
    redoVersion(id)
    toast({
      title: "Changes Redone",
      description: `Successfully redone changes from version ${id}`,
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Version History</h2>
        <p className="text-sm text-gray-500 mt-1">
          {versions.length === 0
            ? "No versions saved yet"
            : `${versions.length} version${versions.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto h-80">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No versions saved yet.</p>
            <p className="text-sm mt-2">Edit the YAML and click Save to create your first version.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {[...versions].reverse().map((version) => (
              <li
                key={version.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedVersionId === version.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => selectVersion(version.id)}
              >
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                          Version {version.id}
                        </span>
                        {version.id === versions[0].id && (
                          <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                            latest
                          </span>
                        )}
                      </div>
                      
                      {editingTitleId === version.id ? (
                        <div className="mt-1 flex items-center">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateVersionTitle(version.id, editingTitleValue)
                                setEditingTitleId(null)
                                e.stopPropagation()
                              } else if (e.key === 'Escape') {
                                setEditingTitleId(null)
                                e.stopPropagation()
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateVersionTitle(version.id, editingTitleValue)
                              setEditingTitleId(null)
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="mt-1 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRevert(version.id)
                          }}
                        >
                          Revert to this
                        </Button>
                      )}
                      
                      {/* Show "Undo" button for all versions except the first one (Version 1) */}
                      {version.id !== 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUndo(version.id)
                          }}
                        >
                          Undo
                        </Button>
                      )}
                      
                      {/* Redo button - hidden for Version 1 */}
                      {version.id !== 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[0.6rem] px-1 py-0.5 h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRedo(version.id)
                          }}
                        >
                          Redo
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {(version.patch || version.reversePatch) && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        Patch details
                      </summary>
                      <div className="mt-1 p-2 bg-gray-50 rounded">
                        {version.patch && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 mb-1">Forward Patch:</h4>
                            <pre className="text-sm text-gray-700 overflow-auto">
                              {JSON.stringify(version.patch, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {version.reversePatch && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-700 mb-1">Reverse Patch:</h4>
                            <pre className="text-sm text-gray-700 overflow-auto">
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
