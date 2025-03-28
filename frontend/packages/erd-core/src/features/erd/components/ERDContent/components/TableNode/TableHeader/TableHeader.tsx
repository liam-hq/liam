import type { TableNodeData } from '@/features/erd/types'
import { useUserEditingStore } from '@/stores'
import { Table2 } from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './TableHeader.module.css'

type Props = {
  data: TableNodeData
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const { showMode: _showMode } = useUserEditingStore()
  const showMode = data.showMode ?? _showMode

  const isTarget = data.targetColumnCardinalities !== undefined
  const isSource = data.sourceColumnName !== undefined

  return (
    <div
      className={clsx(
        styles.wrapper,
        showMode === 'TABLE_NAME' && styles.wrapperTableNameMode,
      )}
    >
      <Table2 width={16} className={styles.tableIcon} />

      <span className={styles.name}>{name}</span>

      {showMode === 'TABLE_NAME' && (
        <>
          {isTarget && (
            <Handle
              id={name}
              type="target"
              position={Position.Left}
              className={styles.handle}
            />
          )}
          {isSource && (
            <Handle
              id={name}
              type="source"
              position={Position.Right}
              className={styles.handle}
            />
          )}
        </>
      )}
    </div>
  )
}
