import { useDBStructureStore, useUserEditingStore } from '@/stores'
import type { Node, NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import { isRelatedToTable } from '../ERDContent'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'
import type { TableNodeType } from './type'

export const isTableNode = (node: Node): node is TableNodeType =>
  node.type === 'table'

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data }) => {
  const { relationships } = useDBStructureStore()
  const {
    active: { tableName },
    showMode,
  } = useUserEditingStore()

  // TODO: remove tableName and isRelatedToTable() from here
  const isActive = data.isActiveHighlighted || tableName === data.table.name

  const isTableHighlighted =
    data.isHighlighted ||
    isRelatedToTable(relationships, data.table.name, tableName)

  return (
    <div
      className={clsx(
        styles.wrapper,
        isTableHighlighted && styles.wrapperHighlighted,
        isActive && styles.wrapperActive,
      )}
      data-erd="table-node"
    >
      <TableHeader data={data} />
      {showMode === 'ALL_FIELDS' && <TableColumnList data={data} />}
      {showMode === 'KEY_ONLY' && (
        <TableColumnList data={data} filter="KEY_ONLY" />
      )}
    </div>
  )
}
