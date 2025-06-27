import { type Column, isPrimaryKey, type Table } from '@liam-hq/db-structure'
import type { FC } from 'react'
import type { TableNodeData } from '@/features/erd/types'
import { columnHandleId } from '@/features/erd/utils'
import { TableColumn } from './TableColumn'

type TableColumnListProps = {
  data: TableNodeData
  filter?: 'KEY_ONLY'
}

const shouldDisplayColumn = (
  column: Column,
  table: Table,
  filter: 'KEY_ONLY' | undefined,
  targetColumnCardinalities: TableNodeData['targetColumnCardinalities'],
): boolean => {
  if (filter === 'KEY_ONLY') {
    return (
      isPrimaryKey(column.name, table.constraints) ||
      targetColumnCardinalities?.[column.name] !== undefined
    )
  }
  return true
}

export const TableColumnList: FC<TableColumnListProps> = ({ data, filter }) => {
  return (
    <ul>
      {Object.values(data.table.columns).map((column) => {
        if (
          !shouldDisplayColumn(
            column,
            data.table,
            filter,
            data.targetColumnCardinalities,
          )
        ) {
          return null
        }
        const handleId = columnHandleId(data.table.name, column.name)
        const isSource = data.sourceColumnName === column.name
        const targetColumnCardinalities = data.targetColumnCardinalities

        return (
          <TableColumn
            key={column.name}
            table={data.table}
            column={column}
            handleId={handleId}
            isSource={isSource}
            targetCardinality={targetColumnCardinalities?.[column.name]}
            isHighlightedTable={data.isHighlighted || data.isActiveHighlighted}
          />
        )
      })}
    </ul>
  )
}
