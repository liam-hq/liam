import {
  type ChangeStatus,
  getIndexRelatedChangeStatus,
  getTableRelatedChangeStatus,
  type Operation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  indexId: string
  operations: Operation[]
}

/**
 * Determines the change status for the index item component.
 *
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition → returns 'added'
 *    - Table deletion → returns 'removed'
 *
 * 2. Index-level changes
 *    - Index addition → returns 'added'
 *    - Index deletion → returns 'removed'
 *    - Index modifications (name, columns, unique, type) → returns 'modified'
 *
 * 3. No changes
 *    - None of the above → returns 'unchanged'
 *
 * Note: Table-level changes take precedence because when a table is
 * added/removed, all its indexes are implicitly affected.
 */
export function getChangeStatus({
  tableId,
  indexId,
  operations,
}: Params): ChangeStatus {
  const tableStatus = getTableRelatedChangeStatus({ tableId, operations })
  if (tableStatus === 'added' || tableStatus === 'removed') {
    return tableStatus
  }

  return getIndexRelatedChangeStatus({
    tableId,
    indexId,
    operations,
  })
}
