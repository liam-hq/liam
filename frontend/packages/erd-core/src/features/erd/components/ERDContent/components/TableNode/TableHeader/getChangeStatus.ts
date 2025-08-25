import {
  type ChangeStatus,
  getColumnRelatedChangeStatus,
  getConstraintRelatedChangeStatus,
  getIndexRelatedChangeStatus,
  getTableRelatedChangeStatus,
  type Operation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  operations: Operation[]
}

/**
 *
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition/deletion → returns 'added'/'removed'
 *    - Table name or comment changes → returns 'modified'
 *
 * 2. Column-level changes
 *    - Any column changes → returns 'modified'
 *
 * 3. Index-level changes
 *    - Any index changes → returns 'modified'
 *
 * 4. Constraint-level changes
 *    - Any constraint changes → returns 'modified'
 *
 * 5. No changes
 *    - None of the above → returns 'unchanged'
 */
export function getChangeStatus({ tableId, operations }: Params): ChangeStatus {
  const tableStatus = getTableRelatedChangeStatus({ tableId, operations })
  if (tableStatus !== 'unchanged') {
    return tableStatus
  }

  const hasColumnChanges =
    getColumnRelatedChangeStatus({ tableId, operations }) !== 'unchanged'
  if (hasColumnChanges) {
    return 'modified'
  }

  const hasIndexChanges =
    getIndexRelatedChangeStatus({ tableId, operations }) !== 'unchanged'
  if (hasIndexChanges) {
    return 'modified'
  }

  const hasConstraintChanges =
    getConstraintRelatedChangeStatus({ tableId, operations }) !== 'unchanged'
  if (hasConstraintChanges) {
    return 'modified'
  }

  return 'unchanged'
}
