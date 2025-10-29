import { type Extension, StateField } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view'

const selectionHighlightDeco = Decoration.mark({
  class: 'cm-customSelectionHighlight',
})

const selectionHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    if (!tr.selection || (!tr.docChanged && !tr.selection)) {
      return deco
    }

    const decorations: Array<{ from: number; to: number }> = []

    for (const range of tr.state.selection.ranges) {
      if (!range.empty) {
        decorations.push({ from: range.from, to: range.to })
      }
    }

    if (decorations.length === 0) {
      return Decoration.none
    }

    return Decoration.set(
      decorations.map((range) =>
        selectionHighlightDeco.range(range.from, range.to),
      ),
    )
  },
  provide: (f) => EditorView.decorations.from(f),
})

const selectionHighlightTheme = EditorView.theme({
  '.cm-customSelectionHighlight': {
    backgroundColor: 'var(--color-green-alpha-35)',
    borderRadius: '2px',
    transition:
      'background-color var(--default-hover-animation-duration) var(--default-timing-function)',
  },
})

export const selectionHighlightExtension: Extension = [
  selectionHighlightField,
  selectionHighlightTheme,
]
