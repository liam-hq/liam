import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { ColumnDefaultDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnDefaultDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnDefaultDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.default
      : after.tables[tableId]?.columns[columnId]?.default

  if (data === undefined) return null

  return {
    kind: 'column-default',
    status,
    data,
    tableId,
    columnId,
  }
}
