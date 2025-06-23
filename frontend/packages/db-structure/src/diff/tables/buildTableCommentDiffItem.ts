import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { TableCommentDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildTableCommentDiffItem(
  tableId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): TableCommentDiffItem | null {
  const status = getChangeStatus({
    tableId,
    operations,
    pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.comment
      : after.tables[tableId]?.comment

  if (data === undefined) return null

  return {
    kind: 'table-comment',
    status,
    data,
    tableId,
  }
}
