'use client'

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import {
  HighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import { MergeView, unifiedMergeView } from '@codemirror/merge'
import type { Extension } from '@codemirror/state'
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
  { tag: tags.propertyName, color: '#85E89D' },
  { tag: tags.string, color: '#C8E1FF' },
  { tag: tags.content, color: '#C8E1FF' },
])

const baseExtensions: Extension[] = [
  lineNumbers(),
  foldGutter(),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  drawSelection(),
  json(),
  lintGutter(),
  syntaxHighlighting(myHighlightStyle),
  customCursorTheme,
]

type MergeMode = 'split' | 'unified'

type Props = {
  /** Original file (read-only) */
  original: string
  /** Modified file (editable) */
  modified: string
  /** Setter for the modified file */
  setModified: Dispatch<SetStateAction<string>>
  /** 'split' = side-by-side view / 'unified' = GitHub-style single column */
  mode?: MergeMode
}

export const useMergeEditor = ({
  original,
  modified,
  setModified,
  mode = 'split',
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView | MergeView>()

  /* Only capture docChanged from the right (editable) side */
  const updateListener = useMemo(
    () =>
      EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.docChanged) setModified(vu.state.doc.toString())
      }),
    [setModified],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!ref.current || view) return

    if (mode === 'split') {
      const mv = new MergeView({
        parent: ref.current,
        a: {
          doc: original,
          extensions: [...baseExtensions, EditorView.editable.of(false)], // left=readOnly
        },
        b: {
          doc: modified,
          extensions: [...baseExtensions, updateListener],
        },
      })
      setView(mv as unknown as EditorView)
    } else {
      /* unifiedMergeView is in the same class hierarchy as EditorView */
      const ev = new EditorView({
        parent: ref.current,
        doc: modified,
        extensions: [
          ...baseExtensions,
          unifiedMergeView({
            original,
            diffConfig: {
              scanLimit: 20000,
              timeout: 2000,
            },
            mergeControls: false,
          }),
          updateListener,
        ],
      })
      setView(ev)
    }
  }, [ref, view])

  useEffect(() => {
    if (!view) return
    if (mode === 'split' && view instanceof MergeView) {
      view.b.dispatch({
        changes: { from: 0, to: view.b.state.doc.length, insert: modified },
      })
    } else if (mode === 'unified' && view instanceof EditorView) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: modified },
      })
    }
  }, [modified, view, mode])

  return { ref }
}
