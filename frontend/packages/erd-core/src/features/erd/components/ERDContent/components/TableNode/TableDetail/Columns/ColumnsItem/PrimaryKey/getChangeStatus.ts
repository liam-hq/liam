import {
  type ChangeStatus,
  getColumnRelatedChangeStatus,
  getConstraintColumnNamesChangeStatus,
  getTableRelatedChangeStatus,
  type Operation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  columnId: string
  constraintId: string
  operations: Operation[]
}

export function getChangeStatus({
  tableId,
  columnId,
  constraintId,
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

  return getConstraintColumnNamesChangeStatus({
    tableId,
    constraintId,
    operations,
  })
}
