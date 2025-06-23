import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { ColumnUniqueDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnUniqueDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnUniqueDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.unique
      : after.tables[tableId]?.columns[columnId]?.unique

  if (data === undefined) return null

  return {
    kind: 'column-unique',
    status,
    data,
    tableId,
    columnId,
  }
}
