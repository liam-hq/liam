import type { Schema, TableGroup } from '@liam-hq/db-structure'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './Tables.module.css'

type ChangeStatus = 'not-change' | 'added' | 'modified' | 'deleted'

function getRandomChangeStatus(): ChangeStatus {
  const statuses: ChangeStatus[] = [
    'not-change',
    'not-change',
    'not-change',
    'not-change',
    'not-change',
    'added',
    'added',
    'modified',
    'modified',
    'deleted',
  ]
  const randomIndex = Math.floor(Math.random() * statuses.length)
  return statuses[randomIndex]
}

type Props = {
  schema: Schema
  tableGroups: Record<string, TableGroup> | undefined
  onTableSelect: (id: string) => void
}

type GroupedTables = {
  [groupName: string]: string[]
}

export const Tables: FC<Props> = ({ schema, tableGroups, onTableSelect }) => {
  if (!schema.tables || Object.keys(schema.tables).length === 0) {
    return <div className={styles.container}>No tables found</div>
  }

  const groupedTables: GroupedTables = {}
  const tableNames = Object.keys(schema.tables)

  if (tableGroups) {
    for (const [, group] of Object.entries(tableGroups)) {
      const validTables = group.tables.filter((tableName) =>
        tableNames.includes(tableName),
      )

      if (validTables.length > 0) {
        groupedTables[group.name] = validTables
      }
    }
  }

  const groupedTableNames = Object.values(groupedTables).flat()
  const ungroupedTables = tableNames.filter(
    (tableName) => !groupedTableNames.includes(tableName),
  )

  if (ungroupedTables.length > 0) {
    groupedTables['Others'] = ungroupedTables
  }

  return (
    <div className={styles.container}>
      {Object.entries(groupedTables).map(([groupName, tables]) => (
        <div key={groupName} className={styles.groupSection}>
          <h3 className={styles.groupHeader}>{groupName}</h3>
          <div className={styles.tablesList}>
            {tables.map((tableName) => {
              const status = getRandomChangeStatus()
              return (
                <button
                  key={tableName}
                  type="button"
                  className={clsx(
                    styles.tableItem,
                    status === 'added' && styles.fileChangeAdded,
                    status === 'modified' && styles.fileChangeModified,
                    status === 'deleted' && styles.fileChangeDeleted,
                  )}
                  onClick={() => onTableSelect(tableName)}
                >
                  {tableName}
                  {status !== 'not-change' && (
                    <span
                      className={clsx(
                        styles.statusCircle,
                        status === 'added' && styles.fileChangeAddedCircle,
                        status === 'modified' &&
                          styles.fileChangeModifiedCircle,
                        status === 'deleted' && styles.fileChangeDeletedCircle,
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
