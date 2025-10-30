import {
  type ChangeStatus,
  getConstraintRelatedChangeStatus,
  getTableRelatedChangeStatus,
  type MigrationOperation,
} from '@liam-hq/schema'

type Params = {
  tableId: string
  constraintId: string
  operations: MigrationOperation[]
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
