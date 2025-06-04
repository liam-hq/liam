import { getChangeStatus } from '@/features/diff/utils/getChangeStatus'
import type { TableNodeData } from '@/features/erd/types'
import { useSchemaStore, useUserEditingStore } from '@/stores'
import { Dot, Minus, Plus, Table2 } from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import { match } from 'ts-pattern'
import styles from './TableHeader.module.css'

type Props = {
  data: TableNodeData
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const { diffItems } = useSchemaStore()
  const { showMode: _showMode, isDiffView } = useUserEditingStore()
  const showMode = data.showMode ?? _showMode

  const isTarget = data.targetColumnCardinalities !== undefined
  const isSource = data.sourceColumnName !== undefined

  const tableStatus = getChangeStatus({
    tableId: name,
    diffItems: diffItems ?? [],
    kind: 'table',
  })

  const diffStyle = useMemo(
    () =>
      match(tableStatus)
        .with('added', () => styles.addedBg)
        .with('removed', () => styles.removedBg)
        .with('modified', () => styles.modifiedBg)
        .otherwise(() => undefined),
    [tableStatus],
  )

  return (
    <div
      className={clsx(
        styles.wrapper,
        showMode === 'TABLE_NAME' && styles.wrapperTableNameMode,
      )}
    >
      {isDiffView && (
        <div
          className={clsx(
            styles.diffBox,
            showMode === 'TABLE_NAME' && styles.diffBoxTableNameMode,
            diffStyle,
          )}
        >
          {match(tableStatus)
            .with('added', () => (
              <Plus className={clsx(styles.diffIcon, styles.addedIcon)} />
            ))
            .with('removed', () => (
              <Minus className={clsx(styles.diffIcon, styles.removedIcon)} />
            ))
            .with('modified', () => (
              <Dot className={clsx(styles.diffIcon, styles.modifiedIcon)} />
            ))
            .otherwise(() => null)}
        </div>
      )}

      <div
        className={clsx(
          styles.container,
          showMode === 'TABLE_NAME' && styles.containerTableNameMode,
          isDiffView && styles.containerDiffView,
          isDiffView && diffStyle,
        )}
      >
        <Table2 className={styles.tableIcon} />

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
    </div>
  )
}
