import type { Operation } from 'fast-json-patch'
import { match, P } from 'ts-pattern'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ConstraintColumnNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildConstraintColumnNameDiffItem(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ConstraintColumnNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    constraintId,
    operations,
    pathRegExp: PATH_PATTERNS.CONSTRAINT_COLUMN_NAME,
  })

  const constraint =
    status === 'removed'
      ? before.tables[tableId]?.constraints[constraintId]
      : after.tables[tableId]?.constraints[constraintId]

  const data = match(constraint)
    .with({ type: 'UNIQUE' }, ({ columnName }) => columnName)
    .with({ type: 'FOREIGN KEY' }, ({ columnName }) => columnName)
    .with({ type: 'PRIMARY KEY' }, ({ columnName }) => columnName)
    .with({ type: 'CHECK' }, () => undefined)
    .with(P.nullish, () => undefined)
    .exhaustive()

  if (data === undefined) return null

  return {
    kind: 'constraint-column-name',
    status,
    data,
    tableId,
    constraintId,
  }
}
