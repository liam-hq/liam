'use client'

import { defaultKeymap } from '@codemirror/commands'
import { history, historyKeymap } from '@codemirror/commands'
import { yaml } from '@codemirror/lang-yaml'
import {
  HighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language'
import { type Diagnostic, lintGutter, linter } from '@codemirror/lint'
import { EditorState, type Extension } from '@codemirror/state'
import {
  type ViewUpdate,
  drawSelection,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { EditorView } from 'codemirror'
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { parseDocument } from 'yaml'

const customCursorTheme = EditorView.theme({
  '.cm-gutters': {
    borderRight: 'solid 1px var(--position-pattern-border)',
    backgroundColor: 'var(--global-background)',
  },
  '.cm-lineNumbers': {
    color: 'var(--overlay-20)',
  },
  '.cm-foldGutter': {
    color: 'var(--overlay-50)',
  },
  '.cm-selectionBackground': {
    background:
      'linear-gradient(0deg, var(--color-green-alpha-20, rgba(29, 237, 131, 0.20)) 0%, var(--color-green-alpha-20, rgba(29, 237, 131, 0.20)) 100%), var(--global-background, #141616) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid var(--overlay-100)',
    animation: 'slow-blink 1s steps(2, start) infinite',
  },
  '@keyframes slow-blink': {
    to: { visibility: 'hidden' },
  },
})

const myHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: '#85E89D' },
  { tag: tags.string, color: '#C8E1FF' },
  { tag: tags.content, color: '#C8E1FF' },
])

const yamlLinter = linter((view) => {
  const diagnostics: Diagnostic[] = []

  try {
    const doc = parseDocument(view.state.doc.toString())

    if (doc.errors.length > 0) {
      diagnostics.push(
        ...doc.errors.map((err) => ({
          from: err.pos[0] ?? 0,
          to: err.pos[1] ?? 0,
          severity: 'error' as const,
          message: err.message,
        })),
      )
    }
  } catch (e: unknown) {
    diagnostics.push({
      from: 0,
      to: 0,
      severity: 'error' as const,
      message: e instanceof Error ? e.message : 'YAML parsing error',
    })
  }

  return diagnostics
})

const extensions: Extension[] = [
  lineNumbers(),
  foldGutter(),
  history(),
  keymap.of(defaultKeymap),
  keymap.of(historyKeymap),
  drawSelection(),
  yaml(),
  lintGutter(),
  yamlLinter,
  syntaxHighlighting(myHighlightStyle),
  customCursorTheme,
]

type Props = {
  doc: string | undefined
  setDoc: Dispatch<SetStateAction<string | undefined>>
}

export const useYamlEditor = ({ doc, setDoc }: Props) => {
  const editor = useRef(null)
  const [container, setContainer] = useState<HTMLDivElement>()
  const [view, setView] = useState<EditorView>()

  const updateListener = useMemo(() => {
    return EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        setDoc(update.state.doc.toString())
      }
    })
  }, [setDoc])

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current)
    }
  }, [])

  useEffect(() => {
    if (!view && container) {
      const state = EditorState.create({
        doc,
        extensions: [...extensions, updateListener],
      })
      const viewCurrent = new EditorView({
        state,
        parent: container,
      })
      setView(viewCurrent)
    }
  }, [view, doc, container, updateListener])

  return {
    editor,
  }
}
