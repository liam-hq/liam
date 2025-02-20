import type { TableNodeType } from '@/features/erd/types'
import { useUserEditingStore } from '@/stores'
import type { NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

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
