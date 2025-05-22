import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ColumnNotNullDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnNotNullDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnNotNullDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.notNull
      : after.tables[tableId]?.columns[columnId]?.notNull

  if (data === undefined) return null

  return {
    kind: 'column-not-null',
    status,
    data,
    tableId,
    columnId,
  }
}
