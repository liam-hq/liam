import { type MouseEvent, useCallback, useEffect } from 'react'
import type { Hash } from '../../../../../../../schemas'
import { useTableSelection } from '../../../../../../erd/hooks'
import {
  getTableColumnElementId,
  getTableColumnLinkHref,
  getTableIndexElementId,
  getTableIndexLinkHref,
  getTableLinkHref,
} from '../../../../../utils'
import { useCommandPaletteOrThrow } from '../../CommandPaletteProvider'
import type { CommandPaletteSuggestion } from '../../types'

export const useTableOptionSelect = (
  suggestion: CommandPaletteSuggestion | null,
) => {
  const { setOpen } = useCommandPaletteOrThrow()

  const { selectTable } = useTableSelection()
  const goToERD = useCallback(
    (tableName: string, hash?: Hash) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
      if (hash) window.location.hash = hash

      setOpen(false)
    },
    [selectTable, setOpen],
  )

  const optionSelectHandler = useCallback(
    (event: MouseEvent, tableName: string, hash?: Hash) => {
      // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
      if (event.ctrlKey || event.metaKey) {
        return
      }

      event.preventDefault()
      goToERD(tableName, hash)
    },
    [goToERD],
  )

  // Select table option by pressing [Enter] key (with/without ⌘ key)
  useEffect(() => {
    // It doesn't subscribe a keydown event listener if the suggestion type is not "table"
    if (suggestion?.type !== 'table') return

    const down = (event: KeyboardEvent) => {
      const suggestedTableName = suggestion.name

      if (event.key === 'Enter') {
        event.preventDefault()

        if (event.metaKey || event.ctrlKey) {
          window.open(getTableLinkHref(suggestedTableName))
        } else {
          goToERD(suggestedTableName)
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestion, goToERD])

  // Select column option by pressing [Enter] key (with/without ⌘ key)
  useEffect(() => {
    // It doesn't subscribe a keydown event listener if the suggestion type is not "column"
    if (suggestion?.type !== 'column') return

    const down = (event: KeyboardEvent) => {
      const { tableName, columnName } = suggestion

      if (event.key === 'Enter') {
        event.preventDefault()

        if (event.metaKey || event.ctrlKey) {
          window.open(getTableColumnLinkHref(tableName, columnName))
        } else {
          goToERD(tableName, getTableColumnElementId(tableName, columnName))
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestion, goToERD])

  // Select index option by pressing [Enter] key (with/without ⌘ key)
  useEffect(() => {
    // It doesn't subscribe a keydown event listener if the suggestion type is not "index"
    if (suggestion?.type !== 'index') return

    const down = (event: KeyboardEvent) => {
      const { tableName, indexName } = suggestion

      if (event.key === 'Enter') {
        event.preventDefault()

        if (event.metaKey || event.ctrlKey) {
          window.open(getTableIndexLinkHref(tableName, indexName))
        } else {
          goToERD(tableName, getTableIndexElementId(tableName, indexName))
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestion, goToERD])

  return { optionSelectHandler }
}
