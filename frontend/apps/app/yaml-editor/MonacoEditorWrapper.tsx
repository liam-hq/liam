'use client'

import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MonacoEditorWrapper({
  value,
  onChange,
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  )
  const isInternalChangeRef = useRef(false)

  useEffect(() => {
    if (editorRef.current && !monacoEditorRef.current) {
      // Define Monaco editor theme
      monaco.editor.defineTheme('yamlEditorDark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'operator', foreground: 'D4D4D4' },
          { token: 'key', foreground: '9CDCFE' },
          { token: 'string.yaml', foreground: 'CE9178' },
          { token: 'type', foreground: '4EC9B0' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': '#D4D4D4',
          'editorCursor.foreground': '#AEAFAD',
          'editor.lineHighlightBackground': '#282828',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
        },
      })

      // Initialize Monaco editor
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value: value,
        language: 'yaml',
        theme: 'yamlEditorDark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        tabSize: 2,
        wordWrap: 'on',
        fontSize: 14,
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      })

      // Listen for content changes
      monacoEditorRef.current.onDidChangeModelContent(() => {
        const newValue = monacoEditorRef.current?.getValue() || ''
        // Set the flag to indicate this change came from the editor
        isInternalChangeRef.current = true
        onChange(newValue)
      })
    }

    return () => {
      // Cleanup
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose()
        monacoEditorRef.current = null
      }
    }
  }, [])

  // Update editor content when value changes externally
  useEffect(() => {
    if (monacoEditorRef.current) {
      // Only update the editor if the change didn't come from the editor itself
      if (!isInternalChangeRef.current) {
        const currentValue = monacoEditorRef.current.getValue()
        if (currentValue !== value) {
          monacoEditorRef.current.setValue(value)
        }
      }
      // Reset the flag after processing
      isInternalChangeRef.current = false
    }
  }, [value])

  return <div ref={editorRef} className="h-full w-full" />
}
