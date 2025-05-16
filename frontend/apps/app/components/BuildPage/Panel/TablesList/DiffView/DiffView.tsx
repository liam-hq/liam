import { type Schema, buildSchemaDiff } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './DiffView.module.css'
import { TableItem } from './TableItem'

type Props = {
  before: Schema
  after: Schema
}

export const DiffView: FC<Props> = ({ before, after }) => {
  const allTableIds = [
    ...new Set([
      ...Object.keys(before.tables || {}),
      ...Object.keys(after.tables || {}),
    ]),
  ]
  const allTables = allTableIds.map(
    (id) => before.tables[id] || after.tables[id],
  )
  const diff = buildSchemaDiff(before, after)

  return (
    <div className={styles.tableList}>
      {allTables.map((table) => {
        const beforeTable = before.tables[table.name]
        const afterTable = after.tables[table.name]

        return (
          <div key={table.name} className={styles.beforeAndAfter}>
            {beforeTable && (
              <TableItem table={beforeTable} diff={diff} type="before" />
            )}
            {afterTable && (
              <TableItem table={afterTable} diff={diff} type="after" />
            )}
          </div>
        )
      })}
    </div>
  )
}
