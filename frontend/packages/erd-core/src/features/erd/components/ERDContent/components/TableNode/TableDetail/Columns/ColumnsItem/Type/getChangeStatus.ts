import {
  type ChangeStatus,
  getColumnRelatedChangeStatus,
  getColumnTypeChangeStatus,
  getTableRelatedChangeStatus,
  type MigrationOperation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  columnId: string
  operations: MigrationOperation[]
}

/**
 * Determines the change status for the column type component.
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
 * 3. Column type changes
 *    - Type modification → returns 'modified'
 *
 * 4. No changes
 *    - None of the above → returns 'unchanged'
 *
 * Note: Table and column-level changes take precedence because when a
 * table/column is added/removed, its type is implicitly affected.
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

  return getColumnTypeChangeStatus({
    tableId,
    columnId,
    operations,
  })
}
