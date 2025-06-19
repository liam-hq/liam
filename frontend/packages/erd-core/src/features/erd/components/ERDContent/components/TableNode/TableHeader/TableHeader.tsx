import { Table2 } from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import type { FC, MouseEvent } from 'react'
import type { TableNodeData } from '@/features/erd/types'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useUserEditing } from '@/stores'
import styles from './TableHeader.module.css'

type Props = {
  data: TableNodeData
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const { showMode: _showMode } = useUserEditing()
  const showMode = data.showMode ?? _showMode

  const isTarget = data.targetColumnCardinalities !== undefined
  const isSource = data.sourceColumnName !== undefined

  const { updateNode } = useCustomReactflow()

  const handleHoverEvent = (event: MouseEvent<HTMLSpanElement>) => {
    // Get computed styles to check if text is truncated
    const element = event.currentTarget
    // Create a range to measure the text
    const range = document.createRange()
    range.selectNodeContents(element)

    // Get the text width using getBoundingClientRect
    const textWidth = range.getBoundingClientRect().width
    const containerWidth = element.getBoundingClientRect().width
    const isTruncated = textWidth > containerWidth + 0.018

    updateNode(name, {
      data: {
        ...data,
        isTooltipVisible: isTruncated,
      },
    })
  }

  return (
    <div
      className={clsx(
        styles.wrapper,
        showMode === 'TABLE_NAME' && styles.wrapperTableNameMode,
      )}
    >
      <Table2 width={16} className={styles.tableIcon} />

      <button
        className={styles.name}
        onMouseEnter={handleHoverEvent}
        type="button"
      >
        {name}
      </button>

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
