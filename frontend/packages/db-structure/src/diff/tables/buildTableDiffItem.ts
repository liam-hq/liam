import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { TableDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildTableDiffItem(
  tableId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): TableDiffItem | null {
  const status = getChangeStatus({
    tableId,
    operations,
    pathRegExp: PATH_PATTERNS.TABLE_BASE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed' ? before.tables[tableId] : after.tables[tableId]

  if (data === undefined) return null

  return {
    kind: 'table',
    status,
    data,
    tableId,
  }
}
