import type { Operation } from 'fast-json-patch'
import { match, P } from 'ts-pattern'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
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
    // TODO: Currently only detects changes in the first column of composite constraints
    .with({ type: 'UNIQUE' }, ({ columnNames }) => columnNames[0])
    .with({ type: 'FOREIGN KEY' }, ({ columnNames }) => columnNames[0])
    // TODO: Currently only detects changes in the first column of composite constraints
    .with({ type: 'PRIMARY KEY' }, ({ columnNames }) => columnNames[0])
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
