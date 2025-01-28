import { useUserEditingStore } from '@/stores'
import {
  Table2,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import type { Data } from '../type'
import styles from './TableHeader.module.css'

type Props = {
  data: Data
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const { showMode } = useUserEditingStore()

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

      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <span className={styles.name}>{name}</span>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent side={'top'} sideOffset={4}>
              {name}
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>

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
