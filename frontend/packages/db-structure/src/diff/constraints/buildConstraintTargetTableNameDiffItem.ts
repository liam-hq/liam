import type { Operation } from 'fast-json-patch'
import { match, P } from 'ts-pattern'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { ConstraintTargetTableNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildConstraintTargetTableNameDiffItem(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ConstraintTargetTableNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    constraintId,
    operations,
    pathRegExp: PATH_PATTERNS.CONSTRAINT_TARGET_TABLE_NAME,
  })

  const constraint =
    status === 'removed'
      ? before.tables[tableId]?.constraints[constraintId]
      : after.tables[tableId]?.constraints[constraintId]

  const data = match(constraint)
    .with({ type: 'UNIQUE' }, () => undefined)
    .with({ type: 'FOREIGN KEY' }, ({ targetTableName }) => targetTableName)
    .with({ type: 'PRIMARY KEY' }, () => undefined)
    .with({ type: 'CHECK' }, () => undefined)
    .with({ type: 'INTERLEAVE' }, () => undefined)
    .with(P.nullish, () => undefined)
    .exhaustive()

  if (data === undefined) return null

  return {
    kind: 'constraint-target-table-name',
    status,
    data,
    tableId,
    constraintId,
  }
}
