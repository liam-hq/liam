import { updateActiveTableName, useDBStructureStore } from '@/stores'
import type { Table } from '@liam-hq/db-structure'
import { DiamondFillIcon, DiamondIcon, KeyRound } from '@liam-hq/ui'
import * as ContextMenu from '@radix-ui/react-context-menu'
import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useReactFlow,
} from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { convertDBStructureToNodes } from '../../convertDBStructureToNodes'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'
import { extractDBStructureForTable } from './extractDBStructureForTable'

type Data = {
  table: Table
}

type TableNodeType = Node<Data, 'Table'>

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ id, data: { table } }) => {
  const { getNodes, setNodes } = useReactFlow()

  const dbStructure = useDBStructureStore()
  const { relationships } = dbStructure
  const extractedDBStructure = extractDBStructureForTable(table, dbStructure)
  const { nodes } = convertDBStructureToNodes(extractedDBStructure)

  const handleClick = useCallback(() => {
    updateActiveTableName(table.name)
  }, [table])

  const handleClickAssemble = useCallback(() => {
    const allNodes = getNodes()
    const currentNode = allNodes.find((node) => node.id === id)

    if (currentNode === undefined) return

    const relatedNodes = nodes.filter((node) => node.id !== currentNode.id)
    const nodeWidth = 172
    const padding = 80
    const minRadius = nodeWidth + padding
    const numNodes = relatedNodes.length
    const circumference = numNodes * (nodeWidth + padding)
    const radius = Math.max(minRadius, circumference / (2 * Math.PI))

    const angleStep = (2 * Math.PI) / numNodes

    const updatedNodes = allNodes.map((node, index) => {
      const isTarget = relatedNodes.some(
        (relatedNode) => relatedNode.id === node.id,
      )

      if (isTarget) {
        const angle = angleStep * index
        return {
          ...node,
          position: {
            x: currentNode.position.x + radius * Math.cos(angle),
            y: currentNode.position.y + radius * Math.sin(angle),
          },
        }
      }

      return node
    })

    setNodes(updatedNodes)
  }, [id, nodes, getNodes, setNodes])

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <button type="button" className={styles.wrapper} onClick={handleClick}>
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
        </button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className={styles.contextMenuContent}
          alignOffset={4}
        >
          <ContextMenu.Item className={styles.contextMenuItem}>
            <button type="button" onClick={handleClickAssemble}>
              Assemble!!
            </button>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
