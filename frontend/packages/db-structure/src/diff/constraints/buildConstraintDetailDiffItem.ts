import type { Operation } from 'fast-json-patch'
import { match, P } from 'ts-pattern'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ConstraintDetailDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildConstraintDetailDiffItem(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ConstraintDetailDiffItem | null {
  const status = getChangeStatus({
    tableId,
    constraintId,
    operations,
    pathRegExp: PATH_PATTERNS.CONSTRAINT_DETAIL,
  })

  const constraint =
    status === 'removed'
      ? before.tables[tableId]?.constraints[constraintId]
      : after.tables[tableId]?.constraints[constraintId]

  const data = match(constraint)
    .with({ type: 'UNIQUE' }, () => undefined)
    .with({ type: 'FOREIGN KEY' }, () => undefined)
    .with({ type: 'PRIMARY KEY' }, () => undefined)
    .with({ type: 'CHECK' }, ({ detail }) => detail)
    .with(P.nullish, () => undefined)
    .exhaustive()

  if (data === undefined) return null

  return {
    kind: 'constraint-detail',
    status,
    data,
    tableId,
    constraintId,
  }
}
