import { useUserEditingStore } from '@/stores'
import type { Node, NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'
import type { TableNodeType } from './type'

export const isTableNode = (node: Node): node is TableNodeType =>
  node.type === 'table'

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data }) => {
  const { showMode } = useUserEditingStore()

  return (
    <div
      className={clsx(
        styles.wrapper,
        data.isHighlighted && styles.wrapperHighlighted,
        data.isActiveHighlighted && styles.wrapperActive,
      )}
      data-erd={
        (data.isHighlighted || data.isActiveHighlighted) &&
        'table-node-highlighted'
      }
    >
      <TableHeader data={data} />
      {showMode === 'ALL_FIELDS' && <TableColumnList data={data} />}
      {showMode === 'KEY_ONLY' && (
        <TableColumnList data={data} filter="KEY_ONLY" />
      )}
    </div>
  )
}
