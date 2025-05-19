import type { SchemaDiffItem, Table } from '@liam-hq/db-structure'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import styles from './TableItem.module.css'

function getChangeStatusStyle(
  tableId: string,
  diffItems: SchemaDiffItem[],
  kind: SchemaDiffItem['kind'],
  type: 'before' | 'after',
) {
  const status =
    diffItems.find((item) => item.kind === kind && item.tableId === tableId)
      ?.status ?? 'unchanged'

  return match([status, type])
    .with(['added', 'after'], () => styles.added)
    .with(['modified', 'after'], () => styles.added)
    .with(['removed', 'before'], () => styles.removed)
    .with(['modified', 'before'], () => styles.removed)
    .otherwise(() => '')
}

type Props = {
  table: Table
  diff: SchemaDiffItem[]
  type: 'before' | 'after'
}

export const TableItem: FC<Props> = ({ table, diff, type }) => {
  const tableStatusStyle = getChangeStatusStyle(table.name, diff, 'table', type)
  const tableNameStatusStyle = getChangeStatusStyle(
    table.name,
    diff,
    'table-name',
    type,
  )
  const tableCommentStatusStyle = getChangeStatusStyle(
    table.name,
    diff,
    'table-comment',
    type,
  )

  return (
    <section
      className={clsx(
        styles.tableSection,
        tableStatusStyle,
        type === 'after' && styles.after,
        type === 'before' && styles.before,
      )}
    >
      <h1 className={tableNameStatusStyle}>{table.name}</h1>
      <div className={styles.commentSection}>
        <p className={tableCommentStatusStyle}>{table.comment}</p>
      </div>

      <div>
        <h2>Columns</h2>
        {Object.values(table.columns).map((column) => {
          return <div key={column.name}>{column.name}</div>
        })}
      </div>
    </section>
  )
}
