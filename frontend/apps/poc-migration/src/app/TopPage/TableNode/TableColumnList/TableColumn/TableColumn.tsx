import type {
  Cardinality as CardinalityType,
  Column,
  Table,
} from '@liam-hq/db-structure'
import {
  DiamondFillIcon,
  DiamondIcon,
  Dot,
  KeyRound,
  Link,
  Minus,
  Plus,
} from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import { AFTER_DB, BEFORE_DB } from '../../../constants'
import { generateMigrationOperations } from '../../../utils'
import styles from './TableColumn.module.css'

type TableColumnProps = {
  table: Table
  column: Column
  handleId: string
  isSource: boolean
  targetCardinality?: CardinalityType | undefined
}

export const TableColumn: FC<TableColumnProps> = ({
  table,
  column,
  handleId,
  isSource,
  targetCardinality,
}) => {
  const diff = generateMigrationOperations(BEFORE_DB, AFTER_DB)
  const matchedDiff = diff.filter((d) => {
    return match(d)
      .with({ type: 'column-add' }, (d) => d.column.name === column.name)
      .with({ type: 'column-remove' }, (d) => d.columnName === column.name)
      .with({ type: 'column-rename' }, (d) => d.newName === column.name)
      .with({ type: 'table-add' }, (d) => d.table.name === table.name)
      .with({ type: 'table-remove' }, (d) => d.tableName === table.name)
      .otherwise(() => false)
  })

  return (
    <li key={column.name} className={styles.wrapper}>
      <div
        className={clsx(styles.box, {
          [styles.bgGreen]: matchedDiff.some(
            (d) => d.type === 'column-add' || d.type === 'table-add',
          ),
          [styles.bgRed]: matchedDiff.some(
            (d) => d.type === 'column-remove' || d.type === 'table-remove',
          ),
          [styles.bgYellow]: matchedDiff.some(
            (d) => d.type === 'column-rename',
          ),
        })}
      >
        {matchedDiff.some(
          (d) => d.type === 'column-add' || d.type === 'table-add',
        ) && <Plus color="#1DED83" width="0.75rem" height="0.75rem" />}
        {matchedDiff.some(
          (d) => d.type === 'column-remove' || d.type === 'table-remove',
        ) && <Minus color="#F75049" width="0.75rem" height="0.75rem" />}
        {matchedDiff.some((d) => d.type === 'column-rename') && (
          <Dot color="#FFD748" width="0.75rem" height="0.75rem" />
        )}
      </div>
      <div
        className={clsx(styles.columnWrapper, {
          [styles.bgGreen]: matchedDiff.some(
            (d) => d.type === 'column-add' || d.type === 'table-add',
          ),
          [styles.bgRed]: matchedDiff.some(
            (d) => d.type === 'column-remove' || d.type === 'table-remove',
          ),
          [styles.bgYellow]: matchedDiff.some(
            (d) => d.type === 'column-rename',
          ),
        })}
      >
        {column.primary && (
          <KeyRound
            width={16}
            height={16}
            className={styles.primaryKeyIcon}
            role="img"
            aria-label="Primary Key"
            strokeWidth={1.5}
          />
        )}
        {!column.primary && (isSource || targetCardinality) ? (
          <Link
            width={16}
            height={16}
            className={styles.linkIcon}
            role="img"
            aria-label="Foreign Key"
            strokeWidth={1.5}
          />
        ) : !column.primary && column.notNull ? (
          <DiamondFillIcon
            width={16}
            height={16}
            className={styles.diamondIcon}
            role="img"
            aria-label="Not Null"
          />
        ) : !column.primary ? (
          <DiamondIcon
            width={16}
            height={16}
            className={styles.diamondIcon}
            role="img"
            aria-label="Nullable"
          />
        ) : null}

        <span className={styles.columnNameWrapper}>
          <span>{column.name}</span>
          <span className={styles.columnType}>{column.type}</span>
        </span>

        {isSource && (
          <Handle
            id={handleId}
            type="source"
            position={Position.Right}
            className={styles.handle}
          />
        )}

        {targetCardinality && (
          <Handle
            id={handleId}
            type="target"
            position={Position.Left}
            className={styles.handle}
          />
        )}
      </div>
    </li>
  )
}
