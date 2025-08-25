import type { FC } from 'react'
import { useSchemaOrThrow } from '@/stores'
import { TableNode } from '../../../ERDContent/components'
import styles from './CommandPalettePreview.module.css'

type Props = {
  tableName: string
}

export const TablePreview: FC<Props> = ({ tableName }) => {
  const schema = useSchemaOrThrow()
  const table = schema.current.tables[tableName]

  return (
    <div className={styles.container}>
      {table && (
        <TableNode
          id=""
          type="table"
          data={{
            table: table,
            isActiveHighlighted: false,
            isHighlighted: false,
            isTooltipVisible: false,
            sourceColumnName: undefined,
            targetColumnCardinalities: undefined,
            showMode: 'ALL_FIELDS',
          }}
          dragging={false}
          isConnectable={false}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          selectable={false}
          deletable={false}
          selected={false}
          draggable={false}
          zIndex={0}
        />
      )}
    </div>
  )
}
