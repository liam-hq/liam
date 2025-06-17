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
  reviewComments?: ReviewComment[]
  showComments?: boolean
}

export const useMigrationsViewer = ({
  doc,
  reviewComments = [],
  showComments = false,
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

      const extensions = showComments
        ? [...baseExtensions, commentStateField()]
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

      if (showComments && reviewComments.length > 0) {
        const commentEffect = setCommentsEffect.of(reviewComments)
        viewCurrent.dispatch({ effects: [commentEffect] })
      }
    }
  }, [doc, container, showComments, reviewComments])

  useEffect(() => {
    if (!view || !showComments) return

    const effect = setCommentsEffect.of(reviewComments)
    view.dispatch({ effects: [effect] })
  }, [reviewComments, view, showComments])

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
