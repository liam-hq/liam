'use client'

import { sql } from '@codemirror/lang-sql'
import { foldGutter, syntaxHighlighting } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { unifiedMergeView } from '@codemirror/merge'
import { EditorState, type Extension } from '@codemirror/state'
import { drawSelection, lineNumbers } from '@codemirror/view'
import { EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import type { ReviewComment } from '../../../../../../types'
import { commentStateField, setCommentsEffect } from './commentExtension'
import { customTheme, sqlHighlightStyle } from './editorTheme'

const baseExtensions: Extension[] = [
  lineNumbers(),
  foldGutter(),
  drawSelection(),
  sql(),
  lintGutter(),
  syntaxHighlighting(sqlHighlightStyle),
  customTheme,
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

  const buildExtensions = (
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
  }

  const createEditorView = (
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
  }

  const applyComments = (
    view: EditorView,
    showComments: boolean,
    comments: ReviewComment[],
  ): void => {
    if (showComments && comments.length > 0) {
      const commentEffect = setCommentsEffect.of(comments)
      view.dispatch({ effects: [commentEffect] })
    }
  }

  useEffect(() => {
    if (!container) return

    // Clean up existing view
    if (view) {
      view.destroy()
      setView(undefined)
    }

    const extensions = buildExtensions(
      showComments,
      onQuickFix,
      showDiff,
      prevDoc,
    )
    const viewCurrent = createEditorView(doc, extensions, container)
    setView(viewCurrent)

    applyComments(viewCurrent, showComments, comments)
  }, [doc, prevDoc, showDiff, container, showComments, comments])

  useEffect(() => {
    if (!view || !showComments) return

    const effect = setCommentsEffect.of(comments)
    view.dispatch({ effects: [effect] })
  }, [comments, view, showComments])

  useEffect(() => {
    return () => {
      if (view) {
        view.destroy()
      }
    }
  }, [view])

  return {
    ref,
  }
}
