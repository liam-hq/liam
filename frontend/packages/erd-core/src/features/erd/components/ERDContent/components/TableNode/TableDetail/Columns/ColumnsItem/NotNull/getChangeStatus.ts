import {
  type ChangeStatus,
  getColumnNotNullChangeStatus,
  getColumnRelatedChangeStatus,
  getTableRelatedChangeStatus,
  type Operation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  columnId: string
  operations: Operation[]
}

/**
 * Determines the change status for the column not null constraint component.
 *
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition → returns 'added'
 *    - Table deletion → returns 'removed'
 *
 * 2. Column-level changes
 *    - Column addition → returns 'added'
 *    - Column deletion → returns 'removed'
 *
 * 3. Column not null constraint changes
 *    - Not null constraint modification → returns 'modified'
 *
 * 4. No changes
 *    - None of the above → returns 'unchanged'
 *
 * Note: Table and column-level changes take precedence because when a
 * table/column is added/removed, its not null constraint is implicitly affected.
 */
export function getChangeStatus({
  tableId,
  columnId,
  operations,
}: Params): ChangeStatus {
  const tableStatus = getTableRelatedChangeStatus({ tableId, operations })
  if (tableStatus === 'added' || tableStatus === 'removed') {
    return tableStatus
  }

  const columnStatus = getColumnRelatedChangeStatus({
    tableId,
    columnId,
    operations,
  })
  if (columnStatus === 'added' || columnStatus === 'removed') {
    return columnStatus
  }

  return getColumnNotNullChangeStatus({
    tableId,
    columnId,
    operations,
  })
}
