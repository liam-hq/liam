import type { Operation } from 'fast-json-patch'
import { P, match } from 'ts-pattern'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ConstraintDeleteConstraintDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildConstraintDeleteConstraintDiffItem(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ConstraintDeleteConstraintDiffItem | null {
  const status = getChangeStatus({
    tableId,
    constraintId,
    operations,
    pathRegExp: PATH_PATTERNS.CONSTRAINT_DELETE_CONSTRAINT,
  })

  const constraint =
    status === 'removed'
      ? before.tables[tableId]?.constraints[constraintId]
      : after.tables[tableId]?.constraints[constraintId]

  const data = match(constraint)
    .with({ type: 'UNIQUE' }, () => undefined)
    .with({ type: 'FOREIGN KEY' }, ({ deleteConstraint }) => deleteConstraint)
    .with({ type: 'PRIMARY KEY' }, () => undefined)
    .with({ type: 'CHECK' }, () => undefined)
    .with(P.nullish, () => undefined)
    .exhaustive()

  if (data === undefined) return null

  return {
    kind: 'constraint-delete-constraint',
    status,
    data,
    tableId,
    constraintId,
  }
}
