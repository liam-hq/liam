import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ColumnNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnNameDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_NAME,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.name
      : after.tables[tableId]?.columns[columnId]?.name

  if (data === undefined) return null

  return {
    kind: 'column-name',
    status,
    data,
    tableId,
    columnId,
  }
}
