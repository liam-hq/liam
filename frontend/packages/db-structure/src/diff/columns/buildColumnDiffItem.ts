import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ColumnDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_BASE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]
      : after.tables[tableId]?.columns[columnId]

  if (data === undefined) return null

  return {
    kind: 'column',
    status,
    data,
    tableId,
    columnId,
  }
}
