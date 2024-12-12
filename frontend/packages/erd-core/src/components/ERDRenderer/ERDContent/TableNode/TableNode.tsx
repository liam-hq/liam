import {
  updateActiveTableName,
  useDBStructureStore,
  useUserEditingStore,
} from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import {
  CardinalityZeroOrManyLeftIcon,
  CardinalityZeroOrOneLeftIcon,
  CardinalityZeroOrOneRightIcon,
  DiamondFillIcon,
  DiamondIcon,
  KeyRound,
} from '@liam-hq/ui'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { type FC, useCallback } from 'react'
import { match } from 'ts-pattern'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

type Data = {
  table: Table
  isHighlighted: boolean
  highlightedHandles: string[]
}

type TableNodeType = Node<Data, 'Table'>

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({
  data: { table, isHighlighted, highlightedHandles },
}) => {
  const { relationships } = useDBStructureStore()
  const {
    active: { tableName },
  } = useUserEditingStore()
  const isActive = tableName === table.name
  const { showMode } = useUserEditingStore()

  const handleClick = useCallback(() => {
    updateActiveTableName(table.name)
  }, [table])

  return (
    <button
      type="button"
      className={clsx(styles.wrapper, isActive && styles.wrapperActive)}
      onClick={handleClick}
    >
      <TableHeader name={table.name} />
      {showMode === 'ALL_FIELDS' && (
        <ul>
          {Object.values(table.columns).map((column) => {
            const handleId = `${table.name}-${column.name}`
            const isSource = Object.values(relationships).some(
              (relationship) =>
                relationship.primaryTableName === table.name &&
                relationship.primaryColumnName === column.name,
            )
            const targetCardinality = Object.values(relationships).find(
              ({ foreignTableName, foreignColumnName }) =>
                foreignTableName === table.name &&
                foreignColumnName === column.name,
            )?.cardinality

            return (
              <li key={column.name} className={styles.columnWrapper}>
                {column.primary && (
                  <KeyRound
                    width={16}
                    height={16}
                    className={styles.primaryKeyIcon}
                    role="img"
                    aria-label="Primary Key"
                  />
                )}
                {!column.primary &&
                  (column.notNull ? (
                    <DiamondFillIcon
                      width={16}
                      height={16}
                      className={styles.diamondIcon}
                      role="img"
                      aria-label="Not Null"
                    />
                  ) : (
                    <DiamondIcon
                      width={16}
                      height={16}
                      className={styles.diamondIcon}
                      role="img"
                      aria-label="Nullable"
                    />
                  ))}

                <span className={styles.columnNameWrapper}>
                  <span className={styles.columnName}>{column.name}</span>
                  <span className={styles.columnType}>{column.type}</span>
                </span>

                {isSource && (
                  <>
                    <Handle
                      id={handleId}
                      type="source"
                      position={Position.Right}
                      className={clsx([styles.handle])}
                    />
                    <CardinalityZeroOrOneRightIcon
                      className={clsx([
                        styles.handleCardinality,
                        styles.handleCardinalityRight,
                        (isHighlighted ||
                          highlightedHandles?.includes(handleId)) &&
                          styles.handleCardinalityHighlighted,
                      ])}
                    />
                  </>
                )}

                {targetCardinality && (
                  <>
                    <Handle
                      id={handleId}
                      type="target"
                      position={Position.Left}
                      className={clsx([styles.handle])}
                    />
                    {match(targetCardinality)
                      .with('ONE_TO_ONE', () => (
                        <CardinalityZeroOrOneLeftIcon
                          className={clsx([
                            styles.handleCardinality,
                            styles.handleCardinalityLeft,
                            (isHighlighted ||
                              highlightedHandles?.includes(handleId)) &&
                              styles.handleCardinalityHighlighted,
                          ])}
                        />
                      ))
                      .with('ONE_TO_MANY', () => (
                        <CardinalityZeroOrManyLeftIcon
                          className={clsx([
                            styles.handleCardinality,
                            styles.handleCardinalityLeft,
                            (isHighlighted ||
                              highlightedHandles?.includes(handleId)) &&
                              styles.handleCardinalityHighlighted,
                          ])}
                        />
                      ))
                      .otherwise(() => null)}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </button>
  )
}
