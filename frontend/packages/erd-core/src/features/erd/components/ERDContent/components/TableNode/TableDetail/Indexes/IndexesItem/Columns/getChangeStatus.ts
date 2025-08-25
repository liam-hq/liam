import {
  type ChangeStatus,
  getIndexColumnsChangeStatus,
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
 * Priority order for status determination:
 *
 * 1. Table-level changes
 *    - Table addition/deletion → returns 'added'/'removed'
 *
 * 2. Index-level changes
 *    - Index addition/deletion → returns 'added'/'removed'
 *
 * 3. Index columns changes
 *    - Index columns modification → returns 'modified'
 *
 * 4. No changes
 *    - None of the above → returns 'unchanged'
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

  const indexStatus = getIndexRelatedChangeStatus({
    tableId,
    indexId,
    operations,
  })
  if (indexStatus === 'added' || indexStatus === 'removed') {
    return indexStatus
  }

  return getIndexColumnsChangeStatus({
    tableId,
    indexId,
    operations,
  })
}
