'use client'

import { sql } from '@codemirror/lang-sql'
import { foldGutter, syntaxHighlighting } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { unifiedMergeView } from '@codemirror/merge'
import { EditorState, type Extension } from '@codemirror/state'
import { drawSelection, lineNumbers } from '@codemirror/view'
import { EditorView } from 'codemirror'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReviewComment } from '../../../../../../types'
import { commentStateField, setCommentsEffect } from './commentExtension'
import { customTheme, sqlHighlightStyle } from './editorTheme'
import { selectionHighlightExtension } from './selectionHighlight'

// Function to create fold gutter marker DOM elements
const createFoldMarkerElement = (isOpen: boolean): HTMLElement => {
  const span = document.createElement('span')
  span.className = `cm-foldMarker ${isOpen ? 'open' : 'closed'}`
  const transform = isOpen ? ' transform="rotate(90 8 8)"' : ''
  span.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${transform}/></svg>`
  return span
}

const baseExtensions: Extension[] = [
  lineNumbers(),
  foldGutter({
    markerDOM: (open): HTMLElement => {
      return createFoldMarkerElement(open)
    },
  }),
  drawSelection(),
  selectionHighlightExtension,
  sql(),
  lintGutter(),
  syntaxHighlighting(sqlHighlightStyle),
  customTheme,
  EditorState.readOnly.of(true),
]

type Props = {
  doc: string
  prevDoc?: string
  showDiff?: boolean
  comments?: ReviewComment[]
  showComments?: boolean
  onQuickFix?: (comment: string) => void
}

export const useMigrationsViewer = ({
  doc,
  prevDoc,
  showDiff = false,
  comments = [],
  showComments = false,
  onQuickFix,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLDivElement>()
  const [view, setView] = useState<EditorView>()

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current)
    }
  }, [])

  const buildExtensions = useCallback(
    (
      showComments: boolean,
      onQuickFix?: (comment: string) => void,
      showDiff?: boolean,
      prevDoc?: string,
    ): Extension[] => {
      const extensions = [...baseExtensions]

      if (showComments && onQuickFix) {
        extensions.push(commentStateField(onQuickFix))
      }

      if (showDiff) {
        extensions.push(
          ...unifiedMergeView({
            original: prevDoc || '',
            highlightChanges: true,
            gutter: true,
            mergeControls: false,
            syntaxHighlightDeletions: true,
            allowInlineDiffs: true,
          }),
        )
      }

      return extensions
    },
    [],
  )

  const createEditorView = useCallback(
    (
      doc: string,
      extensions: Extension[],
      container: HTMLDivElement,
    ): EditorView => {
      const state = EditorState.create({
        doc,
        extensions,
      })

      return new EditorView({
        state,
        parent: container,
      })
    },
    [],
  )

  const applyComments = useCallback(
    (
      view: EditorView,
      showComments: boolean,
      comments: ReviewComment[],
    ): void => {
      if (showComments && comments.length > 0) {
        const commentEffect = setCommentsEffect.of(comments)
        view.dispatch({ effects: [commentEffect] })
      }
    },
    [],
  )

  useEffect(() => {
    if (!container) return

    const extensions = buildExtensions(
      showComments,
      onQuickFix,
      showDiff,
      prevDoc,
    )
    const viewCurrent = createEditorView(doc, extensions, container)
    setView(viewCurrent)

    applyComments(viewCurrent, showComments, comments)

    // Cleanup function
    return () => {
      viewCurrent.destroy()
    }
  }, [
    doc,
    prevDoc,
    showDiff,
    container,
    showComments,
    comments,
    applyComments,
    buildExtensions,
    createEditorView,
    onQuickFix,
  ])

  useEffect(() => {
    if (!view || !showComments) return

    const effect = setCommentsEffect.of(comments)
    view.dispatch({ effects: [effect] })
  }, [comments, view, showComments])

  return {
    ref,
  }
}
