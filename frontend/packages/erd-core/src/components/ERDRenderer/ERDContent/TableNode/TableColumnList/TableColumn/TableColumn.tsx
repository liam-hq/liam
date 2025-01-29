import type {
  Cardinality as CardinalityType,
  Column,
} from '@liam-hq/db-structure'
import { DiamondFillIcon, DiamondIcon, KeyRound, Link } from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import type { FC } from 'react'
import styles from './TableColumn.module.css'

type TableColumnProps = {
  column: Column
  handleId: string
  isSource: boolean
  targetCardinality?: CardinalityType | undefined
}

export const TableColumn: FC<TableColumnProps> = ({
  column,
  handleId,
  isSource,
  targetCardinality,
}) => {
  return (
    <li key={column.name} className={styles.columnWrapper}>
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
        <span className={styles.columnName}>{column.name}</span>
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
    </li>
  )
}
