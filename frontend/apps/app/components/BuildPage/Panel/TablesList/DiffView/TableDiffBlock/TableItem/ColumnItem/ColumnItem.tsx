import type {
  Column,
  ColumnRelatedDiffItem,
  SchemaDiffItem,
} from '@liam-hq/db-structure'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import diffStyles from '../Diff.module.css'
import styles from './ColumnItem.module.css'

type Params = {
  tableId: string
  columnId: string
  diffItems: SchemaDiffItem[]
  kind: ColumnRelatedDiffItem['kind']
  type: 'before' | 'after'
}

function getChangeStatusStyle({
  tableId,
  columnId,
  diffItems,
  kind,
  type,
}: Params) {
  const status =
    diffItems.find(
      (item) =>
        item.kind === kind &&
        item.tableId === tableId &&
        item.columnId === columnId,
    )?.status ?? 'unchanged'

  return match([status, type])
    .with(['added', 'after'], () => diffStyles.added)
    .with(['modified', 'after'], () => diffStyles.added)
    .with(['removed', 'before'], () => diffStyles.removed)
    .with(['modified', 'before'], () => diffStyles.removed)
    .otherwise(() => '')
}

type Props = {
  tableId: string
  column: Column
  diffItems: SchemaDiffItem[]
  type: 'before' | 'after'
}

export const ColumnItem: FC<Props> = ({ tableId, column, diffItems, type }) => {
  const columnId = column.name
  const columnStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column',
    type,
  })

  const columnNameStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-name',
    type,
  })

  const columnCommentStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-comment',
    type,
  })

  const columnPrimaryStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-primary',
    type,
  })

  const columnDefaultStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-default',
    type,
  })

  const columnCheckStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-check',
    type,
  })

  const columnUniqueStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-unique',
    type,
  })

  const columnNotNullStyle = getChangeStatusStyle({
    tableId,
    columnId,
    diffItems,
    kind: 'column-not-null',
    type,
  })

  return (
    <div className={clsx(styles.wrapper, columnStyle)}>
      <h2 className={clsx(styles.columnName, columnNameStyle)}>
        {column.name}
      </h2>
      <dl className={styles.dl}>
        <div className={styles.dlItem}>
          <dt>Type</dt>
          <dd>{column.type}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnCommentStyle)}>
          <dt>Comment</dt>
          <dd>{column.comment}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnPrimaryStyle)}>
          <dt>Primary</dt>
          <dd>{column.primary ? '⚪︎' : '-'}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnDefaultStyle)}>
          <dt>Default</dt>
          <dd>{column.default}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnCheckStyle)}>
          <dt>Check</dt>
          <dd>{column.check}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnUniqueStyle)}>
          <dt>Unique</dt>
          <dd>{column.unique ? '⚪︎' : '-'}</dd>
        </div>
        <div className={clsx(styles.dlItem, columnNotNullStyle)}>
          <dt>notNull</dt>
          <dd>{column.notNull ? '⚪︎' : '-'}</dd>
        </div>
      </dl>
    </div>
  )
}
