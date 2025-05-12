"use client"

import { useVersionStore } from "./versionStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef } from "react"

export function VersionList() {
  const { versions, selectedVersionId, selectVersion, revertToVersion } = useVersionStore()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

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
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">Version {version.id}</p>
                    <p className="text-sm text-gray-500">{version.timestamp.toLocaleString()}</p>
                    <pre className="mt-2 text-sm text-gray-700">
                      {version.patch
                        ? JSON.stringify(version.patch, null, 2)
                        : null}
                    </pre>
                  </div>

                  {selectedVersionId === version.id && version.id !== versions[0].id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRevert(version.id)
                      }}
                    >
                      Revert to this
                    </Button>
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
