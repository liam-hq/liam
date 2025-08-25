import {
  type ChangeStatus,
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
 * Determines the change status for the column item component.
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
 *    - Column modifications (type, nullability, default, etc.) → returns 'modified'
 *
 * 3. No changes
 *    - None of the above → returns 'unchanged'
 *
 * Note: Table-level changes take precedence because when a table is
 * added/removed, all its columns are implicitly affected.
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
  return columnStatus
}
