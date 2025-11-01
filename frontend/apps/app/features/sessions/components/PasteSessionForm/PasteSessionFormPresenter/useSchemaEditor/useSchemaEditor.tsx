'use client'

import { sql } from '@codemirror/lang-sql'
import { syntaxHighlighting } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormatType } from '../../../../../../components/FormatIcon/FormatIcon'
import { customTheme, sqlHighlightStyle } from './editorTheme'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  format: FormatType
}

const getLanguageExtension = (format: FormatType): Extension[] => {
  switch (format) {
    case 'postgres':
      return [sql(), syntaxHighlighting(sqlHighlightStyle)]
    case 'schemarb':
    case 'prisma':
    case 'tbls':
      return []
  }
}

const buildExtensions = (
  format: FormatType,
  disabled: boolean,
  onChangeRef: React.MutableRefObject<(value: string) => void>,
): Extension[] => {
  const extensions: Extension[] = [
    lineNumbers(),
    lintGutter(),
    customTheme,
    EditorView.lineWrapping,
    ...getLanguageExtension(format),
  ]

  if (disabled) {
    extensions.push(EditorState.readOnly.of(true))
  } else {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
    )
  }

  return extensions
}

export const useSchemaEditor = ({
  value,
  onChange,
  disabled = false,
  format,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView>()
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // biome-ignore lint/correctness/useExhaustiveDependencies: value is intentionally excluded to prevent editor recreation on every keystroke. Value changes are handled by a separate effect below.
  useEffect(() => {
    if (!ref.current) return

    const extensions = buildExtensions(format, disabled, onChangeRef)
    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const editorView = new EditorView({
      state,
      parent: ref.current,
    })

    setView(editorView)

    return () => {
      editorView.destroy()
    }
  }, [format, disabled])

  useEffect(() => {
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      })
    }
  }, [value, view])

  const focus = useCallback(() => {
    if (view) {
      view.focus()
    }
  }, [view])

  return {
    ref,
    focus,
  }
}
