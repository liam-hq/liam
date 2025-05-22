import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { ColumnCommentDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildColumnCommentDiffItem(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): ColumnCommentDiffItem | null {
  const status = getChangeStatus({
    tableId,
    columnId,
    operations,
    pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.columns[columnId]?.comment
      : after.tables[tableId]?.columns[columnId]?.comment

  if (data === undefined) return null

  return {
    kind: 'column-comment',
    status,
    data,
    tableId,
    columnId,
  }
}
