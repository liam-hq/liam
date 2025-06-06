'use client'

import { sql } from '@codemirror/lang-sql'
import {
  HighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { EditorState, type Extension } from '@codemirror/state'
import { drawSelection, lineNumbers } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'

const customCursorTheme = EditorView.theme({
  '.cm-gutters': {
    borderRight: '1px solid var(--position-pattern-border)',
    background: 'var(--global-background)',
  },
  '.cm-lineNumbers': { color: 'var(--overlay-20)' },
  '.cm-foldGutter': { color: 'var(--overlay-50)' },
  '.cm-selectionBackground': {
    background:
      'linear-gradient(0deg, var(--color-green-alpha-20, rgba(29,237,131,.20)) 0%, var(--color-green-alpha-20, rgba(29,237,131,.20)) 100%), var(--global-background,#141616) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid var(--overlay-100)',
    animation: 'slow-blink 1s steps(2,start) infinite',
  },
  '@keyframes slow-blink': { to: { visibility: 'hidden' } },
})

const myHighlightStyle = HighlightStyle.define([
  // DDL Keywords (CREATE, ALTER, DROP, TABLE, etc.)
  { tag: tags.keyword, color: '#FF6B9D', fontWeight: 'bold' },

  // Data types (text, bigint, boolean, etc.)
  { tag: tags.typeName, color: '#4ECDC4' },

  // Table and column names
  { tag: tags.propertyName, color: '#85E89D' },
  { tag: tags.variableName, color: '#85E89D' },

  // String literals and values
  { tag: tags.string, color: '#C8E1FF' },
  { tag: tags.content, color: '#C8E1FF' },

  // Numbers
  { tag: tags.number, color: '#FFD93D' },

  // Comments (-- comments)
  { tag: tags.comment, color: '#6C7B7F', fontStyle: 'italic' },

  // Operators and punctuation
  { tag: tags.operator, color: '#FF8C42' },
  { tag: tags.punctuation, color: '#FFFFFF' },

  // SQL functions and built-ins
  { tag: tags.function(tags.variableName), color: '#A8E6CF' },

  // Constraints and special keywords (PRIMARY KEY, REFERENCES, etc.)
  { tag: tags.special(tags.keyword), color: '#FFB347', fontWeight: 'bold' },
])

const baseExtensions: Extension[] = [
  lineNumbers(),
  foldGutter(),
  drawSelection(),
  sql(),
  lintGutter(),
  syntaxHighlighting(myHighlightStyle),
  customCursorTheme,
]

type Props = {
  initialDoc: string
}

export const useMigrationsViewer = ({ initialDoc }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLDivElement>()
  const [view, setView] = useState<EditorView>()

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current)
    }
  }, [])

  useEffect(() => {
    if (!view && container) {
      const state = EditorState.create({
        doc: initialDoc,
        extensions: [...baseExtensions],
      })
      const viewCurrent = new EditorView({
        state,
        parent: container,
      })
      setView(viewCurrent)
    }
  }, [view, initialDoc, container])

  return {
    ref,
  }
}
