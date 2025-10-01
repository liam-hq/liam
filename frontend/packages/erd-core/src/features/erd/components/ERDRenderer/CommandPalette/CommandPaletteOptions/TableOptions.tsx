import { Table2 } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect } from 'react'
import { useSchemaOrThrow } from '../../../../../../stores'
import { useTableSelection } from '../../../../hooks'
import { useCommandPaletteOrThrow } from '../CommandPaletteProvider'
import type {
  CommandPaletteInputMode,
  CommandPaletteSuggestion,
} from '../types'
import { getSuggestionText } from '../utils'
import styles from './CommandPaletteOptions.module.css'

const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}

type TableOptionProps = {
  tableName: string
  goToERD: (tableName: string) => void
}

const TableOption: FC<TableOptionProps> = ({ tableName, goToERD }) => {
  return (
    <Command.Item
      key={tableName}
      value={getSuggestionText({ type: 'table', name: tableName })}
    >
      <a
        className={styles.item}
        href={getTableLinkHref(tableName)}
        onClick={(event) => {
          // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
          if (event.ctrlKey || event.metaKey) {
            return
          }

          event.preventDefault()
          goToERD(tableName)
        }}
      >
        <Table2 className={styles.itemIcon} />
        <span className={styles.itemText}>{tableName}</span>
      </a>
    </Command.Item>
  )
}

type Props = {
  suggestion: CommandPaletteSuggestion | null
  inputMode: CommandPaletteInputMode
}

export const TableOptions: FC<Props> = ({ suggestion, inputMode }) => {
  const { setOpen } = useCommandPaletteOrThrow()

  const schema = useSchemaOrThrow()
  const { selectTable } = useTableSelection()

  const goToERD = useCallback(
    (tableName: string) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
      setOpen(false)
    },
    [selectTable, setOpen],
  )

  // Select option by pressing [Enter] key (with/without ⌘ key)
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

  return (
    <Command.Group heading="Tables">
      {inputMode.type === 'table' ? (
        <>
          <TableOption tableName={inputMode.tableName} goToERD={goToERD} />
          {Object.values(
            schema.current.tables[inputMode.tableName]?.columns ?? {},
          ).map((column) => (
            <div key={column.name}>{column.name}</div>
          ))}
        </>
      ) : (
        Object.values(schema.current.tables).map((table) => (
          <TableOption
            key={table.name}
            tableName={table.name}
            goToERD={goToERD}
          />
        ))
      )}
    </Command.Group>
  )
}
