import {
  type ChangeStatus,
  getTableChangeStatus,
  getTableCommentChangeStatus,
  type TableChangeParams,
} from '@liam-hq/schema'

/**
 * Determines the change status for the table comment component.
 *
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition → returns 'added'
 *    - Table deletion → returns 'removed'
 *    - Table name changes → returns 'modified'
 *
 * 2. Table comment changes
 *    - Comment replacement → returns 'modified'
 *    - Comment addition (when implemented) → would return 'added'
 *    - Comment removal (when implemented) → would return 'removed'
 *
 * 3. No changes
 *    - None of the above → returns 'unchanged'
 *
 * Note: Table-level changes take precedence because when a table is
 * added/removed, its comment is implicitly affected.
 */
export function getChangeStatus({
  tableId,
  operations,
}: TableChangeParams): ChangeStatus {
  const tableStatus = getTableChangeStatus({ tableId, operations })
  if (tableStatus === 'added' || tableStatus === 'removed') {
    return tableStatus
  }

  return getTableCommentChangeStatus({
    tableId,
    operations,
  })
}
