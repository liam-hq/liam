import { useDBStructureStore } from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import {
  DiamondFillIcon,
  DiamondIcon,
  DrawerContent,
  DrawerPortal,
  DrawerRoot,
  DrawerTrigger,
  KeyRound,
} from '@liam-hq/ui'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import type { FC } from 'react'
import { TableDetail } from './TableDetail'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

type Data = {
  table: Table
}

type TableNodeType = Node<Data, 'Table'>

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data: { table } }) => {
  const { relationships } = useDBStructureStore()

  return (
    <>
      <DrawerRoot direction="right">
        <DrawerTrigger>
          <div className={styles.wrapper}>
            <TableHeader name={table.name} />
            <ul>
              {Object.values(table.columns).map((column) => {
                const handleId = `${table.name}-${column.name}`
                const isSource = Object.values(relationships).some(
                  (relationship) =>
                    relationship.primaryTableName === table.name &&
                    relationship.primaryColumnName === column.name,
                )

                const isTarget = Object.values(relationships).some(
                  (relationship) =>
                    relationship.foreignTableName === table.name &&
                    relationship.foreignColumnName === column.name,
                )

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
                      <Handle
                        id={handleId}
                        type="source"
                        position={Position.Right}
                        className={styles.handle}
                      />
                    )}

                    {isTarget && (
                      <Handle
                        id={handleId}
                        type="target"
                        position={Position.Left}
                        className={styles.handle}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerContent className={styles.content}>
            <TableDetail table={table} />
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </>
  )
}
