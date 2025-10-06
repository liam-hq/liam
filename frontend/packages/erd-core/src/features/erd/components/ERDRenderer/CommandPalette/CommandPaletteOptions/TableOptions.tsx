import {
  DiamondFillIcon,
  DiamondIcon,
  KeyRound,
  Link,
  Table2,
} from '@liam-hq/ui'
import clsx from 'clsx'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect } from 'react'
import { useSchemaOrThrow } from '../../../../../../stores'
import { useTableSelection } from '../../../../hooks'
import {
  getTableColumnElementId,
  getTableColumnLinkHref,
  getTableLinkHref,
} from '../../../../utils'
import { useCommandPaletteOrThrow } from '../CommandPaletteProvider'
import type {
  CommandPaletteInputMode,
  CommandPaletteSuggestion,
} from '../types'
import { getSuggestionText } from '../utils'
import styles from './CommandPaletteOptions.module.css'

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

type ColumnType = 'PrimaryKey' | 'ForeignKey' | 'NonNull' | 'Default'

const ColumnTypeIcons: Record<ColumnType, FC<{ className?: string }>> = {
  PrimaryKey: KeyRound,
  ForeignKey: Link,
  NonNull: DiamondFillIcon,
  Default: DiamondIcon,
}

type ColumnOptionProps = {
  tableName: string
  columnName: string
  columnType: ColumnType
  goToERD: (tableName: string) => void
}

const ColumnOption: FC<ColumnOptionProps> = ({
  tableName,
  columnName,
  columnType,
  goToERD,
}) => {
  const ColumnTypeIcon = ColumnTypeIcons[columnType]

  return (
    <Command.Item
      key={tableName}
      value={getSuggestionText({
        type: 'column',
        tableName,
        columnName,
      })}
    >
      <a
        href={getTableColumnLinkHref(tableName, columnName)}
        className={clsx(styles.item, styles.indent)}
        onClick={(event) => {
          // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
          if (event.ctrlKey || event.metaKey) {
            return
          }

          event.preventDefault()
          goToERD(tableName)
          location.hash = getTableColumnElementId(tableName, columnName)
        }}
      >
        <ColumnTypeIcon className={styles.itemIcon} />
        <span className={styles.itemText}>{columnName}</span>
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
      const suggestedTableName = suggestion.tableName
      const suggestedColumnName = suggestion.columnName

      if (event.key === 'Enter') {
        event.preventDefault()

        if (event.metaKey || event.ctrlKey) {
          window.open(
            getTableColumnLinkHref(suggestedTableName, suggestedColumnName),
          )
        } else {
          goToERD(suggestedTableName)
          location.hash = getTableColumnElementId(
            suggestedTableName,
            suggestedColumnName,
          )
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestion, goToERD])

  const targetTable =
    inputMode.type === 'table'
      ? schema.current.tables[inputMode.tableName]
      : null

  return (
    <Command.Group heading="Tables">
      {targetTable ? (
        <>
          <TableOption tableName={targetTable.name} goToERD={goToERD} />
          {Object.values(targetTable.columns).map((column) => (
            <ColumnOption
              key={column.name}
              tableName={targetTable.name}
              columnName={column.name}
              columnType={
                Object.values(targetTable.constraints).find(
                  (c) =>
                    c.type === 'PRIMARY KEY' &&
                    c.columnNames.includes(column.name),
                )
                  ? 'PrimaryKey'
                  : Object.values(targetTable.constraints).find(
                        (c) =>
                          c.type === 'FOREIGN KEY' &&
                          c.columnNames.includes(column.name),
                      )
                    ? 'ForeignKey'
                    : column.notNull
                      ? 'NonNull'
                      : 'Default'
              }
              goToERD={goToERD}
            />
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
