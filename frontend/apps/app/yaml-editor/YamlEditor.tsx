"use client"

import { useEffect, useRef, useState } from "react"
import { useVersionStore } from "./versionStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import * as monaco from "monaco-editor"

// This would normally be handled by a loader plugin in Vite
// For simplicity, we're importing it directly
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution"

export function YamlEditor() {
  const { currentYaml, updateCurrentYaml, saveVersion, hasUnsavedChanges, selectedVersionId, versions } = useVersionStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (editorRef.current && !monacoEditorRef.current) {
      // Initialize Monaco editor
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value: currentYaml,
        language: "yaml",
        theme: "vs",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        renderLineHighlight: "all",
        tabSize: 2,
        wordWrap: "on",
      })

      // Listen for content changes
      monacoEditorRef.current.onDidChangeModelContent(() => {
        const value = monacoEditorRef.current?.getValue() || ""
        // Set the flag to indicate this change came from the editor
        isInternalChangeRef.current = true
        updateCurrentYaml(value)
      })

      setIsEditorReady(true)
    }

    return () => {
      // Cleanup
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose()
        monacoEditorRef.current = null
      }
    }
  }, [])

  // Track whether the change came from the editor itself
  const isInternalChangeRef = useRef(false);

  // Update editor content when currentYaml changes externally
  useEffect(() => {
    if (monacoEditorRef.current && isEditorReady) {
      // Only update the editor if the change didn't come from the editor itself
      if (!isInternalChangeRef.current) {
        const currentValue = monacoEditorRef.current.getValue();
        if (currentValue !== currentYaml) {
          monacoEditorRef.current.setValue(currentYaml);
        }
      }
      // Reset the flag after processing
      isInternalChangeRef.current = false;
    }
  }, [currentYaml, isEditorReady])

  const handleSave = () => {
    try {
      saveVersion()
      toast({
        title: "Version Saved",
        description: "Your changes have been saved as a new version",
      })
    } catch (error) {
      toast({
        title: "Error Saving Version",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-700">YAML Editor</h2>
          {selectedVersionId && (
            <div className="ml-2 flex items-center">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                Version {selectedVersionId}
              </span>
              {versions.length > 0 && selectedVersionId === versions[0].id && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                  latest
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && <span className="text-sm text-amber-600">Unsaved changes</span>}
          <Button onClick={handleSave} disabled={!isEditorReady}>
            {!isEditorReady ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Save Version"
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {!isEditorReady && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        <div ref={editorRef} className={`h-full w-full ${isEditorReady ? 'visible' : 'invisible'}`} />
      </div>
    </div>
  )
}
