import { Table2 } from '@liam-hq/ui'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { type FC, type MouseEvent, useMemo } from 'react'
import { match } from 'ts-pattern'
import { DiffIcon } from '@/features/diff/components/DiffIcon'
import diffStyles from '@/features/diff/styles/Diff.module.css'
import type { TableNodeData } from '@/features/erd/types'
import { useSchema, useUserEditing } from '@/stores'
import { getChangeStatus } from './getChangeStatus'
import styles from './TableHeader.module.css'

type Props = {
  data: TableNodeData
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const { showMode: _showMode, showDiff } = useUserEditing()
  const { diffItems } = useSchema()
  const showMode = data.showMode ?? _showMode

  const isTarget = data.targetColumnCardinalities !== undefined
  const isSource = data.sourceColumnName !== undefined

  // Only calculate diff-related values when showDiff is true
  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId: name,
      diffItems: diffItems ?? [],
    })
  }, [showDiff, name, diffItems])

  const diffStyle = useMemo(() => {
    if (!showDiff || !changeStatus) return undefined
    return match(changeStatus)
      .with('added', () => diffStyles.addedBg)
      .with('removed', () => diffStyles.removedBg)
      .with('modified', () => diffStyles.modifiedBg)
      .otherwise(() => undefined)
  }, [showDiff, changeStatus])

  const { updateNode } = useReactFlow()

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
      {showDiff && changeStatus && (
        <div
          className={clsx(
            styles.diffBox,
            showMode === 'TABLE_NAME' && styles.diffBoxTableNameMode,
            diffStyle,
          )}
        >
          <DiffIcon changeStatus={changeStatus} />
        </div>
      )}

      <div
        className={clsx(
          styles.container,
          showMode === 'TABLE_NAME' && styles.containerTableNameMode,
          showDiff && styles.containerDiffView,
          showDiff && diffStyle,
        )}
      >
        <Table2 className={styles.tableIcon} />

        <span className={styles.name} onMouseEnter={handleHoverEvent}>
          {name}
        </span>

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
    </div>
  )
}
