import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { ColumnTypeDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnTypeDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnTypeDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_TYPE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.type
      : after.tables[tableId]?.columns[columnId]?.type

  if (data === undefined) return null

  return {
    kind: 'column-type',
    status,
    data,
    tableId,
    columnId,
  }
}
