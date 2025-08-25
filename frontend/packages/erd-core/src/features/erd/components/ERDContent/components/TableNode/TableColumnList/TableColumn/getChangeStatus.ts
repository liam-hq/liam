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
 *
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition/deletion → returns 'added'/'removed'
 *    - If the table itself has been added or removed, return that status immediately
 *
 * 2. Column-level changes
 *    - Column addition → returns 'added'
 *    - Column deletion → returns 'removed'
 *    - Column property changes (name, type, etc.) → returns 'modified'
 *
 * 3. No changes
 *    - None of the above → returns 'unchanged'
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
