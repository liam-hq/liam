import type { TableNodeData } from '@/features/erd/types'
import { columnHandleId } from '@/features/erd/utils'
import type { Column } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { TableColumn } from './TableColumn'

type TableColumnListProps = {
  data: TableNodeData
  filter?: 'KEY_ONLY'
}

const shouldDisplayColumn = (
  column: Column,
  filter: 'KEY_ONLY' | undefined,
  targetColumnCardinalities: TableNodeData['targetColumnCardinalities'],
): boolean => {
  if (filter === 'KEY_ONLY') {
    return (
      column.primary || targetColumnCardinalities?.[column.name] !== undefined
    )
  }
  return true
}

export const TableColumnList: FC<TableColumnListProps> = ({ data, filter }) => {
  return (
    <ul>
      {Object.values(data.table.columns).map((column) => {
        if (
          !shouldDisplayColumn(column, filter, data.targetColumnCardinalities)
        ) {
          return null
        }
        const handleId = columnHandleId(data.table.name, column.name)
        const isSource = data.sourceColumnName === column.name

        return (
          <TableColumn
            key={column.name}
            column={column}
            handleId={handleId}
            isSource={isSource}
            targetCardinality={data.targetColumnCardinalities?.[column.name]}
          />
        )
      })}
    </ul>
  )
}
