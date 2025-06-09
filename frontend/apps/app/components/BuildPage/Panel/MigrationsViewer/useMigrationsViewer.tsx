'use client'

import { sql } from '@codemirror/lang-sql'
import {
  HighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import {
  EditorState,
  type Extension,
  StateEffect,
  StateField,
} from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  WidgetType,
  drawSelection,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import type { ReviewComment } from './types'

class CommentWidget extends WidgetType {
  constructor(readonly comment: ReviewComment) {
    super()
  }

  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = `cm-comment-widget severity-${this.comment.severity.toLowerCase()}`
    wrap.textContent = this.comment.message
    return wrap
  }

  ignoreEvent() {
    return false
  }
}

const setCommentsEffect = StateEffect.define<ReviewComment[]>()

const commentStateField = StateField.define<DecorationSet>({
  create() {
    // 空のDecorationSetを返す
    return Decoration.none
  },
  update(decorations, tr) {
    // 先にEffectの有無をチェックする
    for (const effect of tr.effects) {
      if (effect.is(setCommentsEffect)) {
        const comments = effect.value
        if (comments.length === 0) {
          return Decoration.none
        }

        const newDecorations = comments.flatMap((comment) => {
          if (comment.toLine > tr.state.doc.lines) {
            return []
          }
          const lineDecorations = []
          for (let i = comment.fromLine; i <= comment.toLine; i++) {
            if (i > tr.state.doc.lines) continue
            const line = tr.state.doc.line(i)
            lineDecorations.push(
              Decoration.line({
                attributes: {
                  class: `cm-highlighted-line severity-bg-${comment.severity.toLowerCase()}`,
                },
              }).range(line.from),
            )
          }
          const widgetLine = tr.state.doc.line(comment.toLine)
          const widgetDecoration = Decoration.widget({
            widget: new CommentWidget(comment),
            side: 1,
          }).range(widgetLine.to)

          return [...lineDecorations, widgetDecoration]
        })

        return Decoration.set(newDecorations, true)
      }
    }

    // Effectがなければ、既存のデコレーションをドキュメントの変更に追従させて返す
    if (tr.docChanged) {
      return decorations.map(tr.changes)
    }

    // 何も変更がなければそのまま返す
    return decorations
  },
  provide(field) {
    // StateFieldが直接DecorationSetを持っているので、そのまま渡す
    return EditorView.decorations.from(field)
  },
})

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

  '.cm-highlighted-line': {
    // 共通のハイライトスタイル
  },
  '.severity-bg-high': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  '.severity-bg-medium': {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  '.severity-bg-low': {
    backgroundColor: 'rgba(99, 241, 120, 0.1)',
  },
  '.cm-comment-widget': {
    padding: '8px 12px',
    marginLeft: '30px',
    borderLeft: '3px solid',
    marginTop: '4px',
    borderRadius: '0 4px 4px 0',
  },
  '.severity-high': {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    color: '#333',
  },
  '.severity-medium': {
    backgroundColor: '#fffbe6',
    borderColor: '#f59e0b',
    color: '#333',
  },
  '.severity-low': {
    backgroundColor: '#eefff4',
    borderColor: '#63f187',
    color: '#333',
  },
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
  commentStateField,
]

type Props = {
  initialDoc: string
  reviewComments?: ReviewComment[]
}

export const useMigrationsViewer = ({
  initialDoc,
  reviewComments = [],
}: Props) => {
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

  useEffect(() => {
    if (!view) return

    const effect = setCommentsEffect.of(reviewComments)
    view.dispatch({ effects: [effect] })
  }, [reviewComments, view])

  return {
    ref,
  }
}
