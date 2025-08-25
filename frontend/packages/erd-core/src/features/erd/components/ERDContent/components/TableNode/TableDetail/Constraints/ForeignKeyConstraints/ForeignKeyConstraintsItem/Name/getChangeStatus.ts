import {
  type ChangeStatus,
  getConstraintColumnNameChangeStatus,
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

  const constraintStatus = getConstraintRelatedChangeStatus({
    tableId,
    constraintId,
    operations,
  })
  if (constraintStatus === 'added' || constraintStatus === 'removed') {
    return constraintStatus
  }

  return getConstraintColumnNameChangeStatus({
    tableId,
    constraintId,
    operations,
  })
}
