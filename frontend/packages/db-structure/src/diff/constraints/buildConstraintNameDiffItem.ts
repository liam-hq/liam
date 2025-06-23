import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { ConstraintNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildConstraintNameDiffItem(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ConstraintNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    constraintId,
    operations,
    pathRegExp: PATH_PATTERNS.CONSTRAINT_NAME,
  })

  const data =
    status === 'removed'
      ? before.tables[tableId]?.constraints[constraintId]?.name
      : after.tables[tableId]?.constraints[constraintId]?.name

  if (data === undefined) return null

  return {
    kind: 'constraint-name',
    status,
    data,
    tableId,
    constraintId,
  }
}
