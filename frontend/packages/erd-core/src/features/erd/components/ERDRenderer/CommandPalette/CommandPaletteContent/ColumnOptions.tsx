import {
  type Cardinality,
  type Column,
  isPrimaryKey,
  type Table,
} from '@liam-hq/db-structure'
import { DiamondFillIcon, DiamondIcon, KeyRound, Table2 } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import { getTableLinkHref, suggestionToString } from '../utils'
import styles from './CommandPaletteContent.module.css'

type Props = {
  searchText: string
  table: Table
  goToERD: (tableName: string) => void
}

const ColumnIcon: FC<{
  table: Table
  column: Column
  targetCardinality?: Cardinality | undefined
}> = ({ table, column }) => {
  if (isPrimaryKey(column.name, table.constraints)) {
    return <KeyRound className={styles.itemIcon} />
  }

  if (column.notNull) {
    return <DiamondFillIcon className={styles.itemIcon} />
  }

  return <DiamondIcon className={styles.itemIcon} />
}

export const ColumnOptions: FC<Props> = ({ searchText, table, goToERD }) => {
  return (
    <Command.Group heading="Tables">
      <Command.Item
        className={styles.item}
        value={suggestionToString({ type: 'table', name: table.name })}
        disabled={searchText !== ''}
        asChild
      >
        <a
          href={getTableLinkHref(table.name)}
          onClick={(event) => {
            // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
            if (event.ctrlKey || event.metaKey) {
              return
            }

            event.preventDefault()
            goToERD(table.name)
          }}
        >
          <Table2 className={styles.itemIcon} />
          <span className={styles.itemText}>{table.name}</span>
        </a>
      </Command.Item>
      {table.columns &&
        Object.values(table?.columns).map((column) => (
          <Command.Item
            key={column.name}
            value={suggestionToString({
              type: 'column',
              tableName: table.name,
              name: column.name,
            })}
            className={styles.item}
            asChild
          >
            <a
              href={getTableLinkHref(table.name)}
              onClick={(event) => {
                // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
                if (event.ctrlKey || event.metaKey) {
                  return
                }

                event.preventDefault()
                goToERD(table.name)
              }}
              className={styles.column}
            >
              <ColumnIcon table={table} column={column} />
              <span className={styles.itemText}>{column.name}</span>
            </a>
          </Command.Item>
        ))}
    </Command.Group>
  )
}
