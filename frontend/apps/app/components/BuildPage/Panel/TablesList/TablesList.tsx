import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './TablesList.module.css'

type Props = {
  schema: Schema
  tableGroups: Record<string, TableGroup>
}

export const TablesList: FC<Props> = ({ schema, tableGroups }) => {
  const tables = Object.values(schema.tables)

  return (
    <div className={styles.tablesList}>
      <div className={styles.tablesContainer}>
        {tables.map((table) => {
          const tableGroupNames = Object.entries(tableGroups)
            .filter(([_, group]) => group.tables.includes(table.name))
            .map(([_, group]) => group.name)

          return (
            <div key={table.name} className={styles.tableItem}>
              <div className={styles.tableName}>{table.name}</div>
              <div className={styles.tableInfo}>
                {tableGroupNames.length > 0 && (
                  <div className={styles.tableGroups}>
                    {tableGroupNames.map((groupName) => (
                      <span key={groupName} className={styles.tableGroupTag}>
                        {groupName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {table.comment && (
                <div className={styles.tableComment}>{table.comment}</div>
              )}
              <div className={styles.tableColumns}>
                {Object.values(table.columns).map((column) => (
                  <div key={column.name} className={styles.columnItem}>
                    <span className={styles.columnName}>{column.name}</span>
                    <span className={styles.columnType}>{column.type}</span>
                    {column.primary && (
                      <span className={styles.columnTag}>PK</span>
                    )}
                    {column.unique && (
                      <span className={styles.columnTag}>UQ</span>
                    )}
                    {column.notNull && (
                      <span className={styles.columnTag}>NOT NULL</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
