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
  commentStateField(),
  syntaxHighlighting(sqlHighlightStyle),
  customTheme,
]

type Props = {
  doc: string
  reviewComments?: ReviewComment[]
}

export const useMigrationsViewer = ({ doc, reviewComments = [] }: Props) => {
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
        doc,
        extensions: [...baseExtensions],
      })
      const viewCurrent = new EditorView({
        state,
        parent: container,
      })
      setView(viewCurrent)
    }
  }, [view, doc, container])

  useEffect(() => {
    if (!view) return

    const effect = setCommentsEffect.of(reviewComments)
    view.dispatch({ effects: [effect] })
  }, [reviewComments, view])

  return {
    ref,
  }
}
