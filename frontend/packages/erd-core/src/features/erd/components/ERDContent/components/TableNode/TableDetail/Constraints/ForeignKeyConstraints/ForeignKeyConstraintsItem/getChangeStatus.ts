import {
  type ChangeStatus,
  getConstraintRelatedChangeStatus,
  getTableRelatedChangeStatus,
  type Operation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  constraintId: string
  operations: Operation[]
}

export function getChangeStatus({
  tableId,
  constraintId,
  operations,
}: Params): ChangeStatus {
  const tableStatus = getTableRelatedChangeStatus({ tableId, operations })
  if (tableStatus === 'added' || tableStatus === 'removed') {
    return tableStatus
  }

  return getConstraintRelatedChangeStatus({
    tableId,
    constraintId,
    operations,
  })
}
