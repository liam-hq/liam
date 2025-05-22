import type {
  Index,
  IndexRelatedDiffItem,
  SchemaDiffItem,
} from '@liam-hq/db-structure'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import diffStyles from '../Diff.module.css'
import styles from './IndexItem.module.css'

type Params = {
  tableId: string
  indexId: string
  diffItems: SchemaDiffItem[]
  kind: IndexRelatedDiffItem['kind']
  type: 'before' | 'after'
}

function getChangeStatusStyle({
  tableId,
  indexId,
  diffItems,
  kind,
  type,
}: Params) {
  const status =
    diffItems.find(
      (item) =>
        item.kind === kind &&
        item.tableId === tableId &&
        item.indexId === indexId,
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
  index: Index
  diffItems: SchemaDiffItem[]
  type: 'before' | 'after'
}

export const IndexItem: FC<Props> = ({ tableId, index, diffItems, type }) => {
  const indexId = index.name
  const indexStyle = getChangeStatusStyle({
    tableId,
    indexId,
    diffItems,
    kind: 'index',
    type,
  })

  const indexNameStyle = getChangeStatusStyle({
    tableId,
    indexId,
    diffItems,
    kind: 'index-name',
    type,
  })

  const indexUniqueStyle = getChangeStatusStyle({
    tableId,
    indexId,
    diffItems,
    kind: 'index-unique',
    type,
  })

  const indexTypeStyle = getChangeStatusStyle({
    tableId,
    indexId,
    diffItems,
    kind: 'index-type',
    type,
  })

  const indexColumnsStyle = getChangeStatusStyle({
    tableId,
    indexId,
    diffItems,
    kind: 'index-columns',
    type,
  })

  return (
    <div className={clsx(styles.wrapper, indexStyle)}>
      <h2 className={clsx(styles.indexName, indexNameStyle)}>{index.name}</h2>
      <dl className={styles.dl}>
        <div className={clsx(styles.dlItem, indexTypeStyle)}>
          <dt>Type</dt>
          <dd>{index.type}</dd>
        </div>
        <div className={clsx(styles.dlItem, indexUniqueStyle)}>
          <dt>Unique</dt>
          <dd>{index.unique ? '⚪︎' : '-'}</dd>
        </div>
        <div className={clsx(styles.dlItem, indexColumnsStyle)}>
          <dt>Columns</dt>
          <dd>
            <ol>
              {index.columns.map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ol>
          </dd>
        </div>
      </dl>
    </div>
  )
}
