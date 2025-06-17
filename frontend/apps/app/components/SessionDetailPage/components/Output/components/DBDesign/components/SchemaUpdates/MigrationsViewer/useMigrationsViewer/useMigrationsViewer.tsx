'use client'

import { sql } from '@codemirror/lang-sql'
import { foldGutter, syntaxHighlighting } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { EditorState, type Extension } from '@codemirror/state'
import { drawSelection, lineNumbers } from '@codemirror/view'
import { EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { commentStateField, setCommentsEffect } from './commentExtension'
import { customTheme, sqlHighlightStyle } from './editorTheme'
import type { ReviewComment } from './types'

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
  comments?: ReviewComment[]
  showComments?: boolean
  onQuickFix?: (comment: string) => void
}

export const useMigrationsViewer = ({
  doc,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: including view in the dependency array causes an infinite loop
  useEffect(() => {
    if (container) {
      if (view) {
        view.destroy()
        setView(undefined)
      }

      const extensions =
        showComments && onQuickFix
          ? [...baseExtensions, commentStateField(onQuickFix)]
          : baseExtensions

      const state = EditorState.create({
        doc,
        extensions,
      })
      const viewCurrent = new EditorView({
        state,
        parent: container,
      })
      setView(viewCurrent)

      if (showComments && comments.length > 0) {
        const commentEffect = setCommentsEffect.of(comments)
        viewCurrent.dispatch({ effects: [commentEffect] })
      }
    }
  }, [doc, container, showComments, comments])

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
