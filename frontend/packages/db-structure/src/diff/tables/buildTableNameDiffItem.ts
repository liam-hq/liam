import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { TableNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildTableNameDiffItem(
  tableId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): TableNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    operations,
    pathRegExp: PATH_PATTERNS.TABLE_NAME,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.name
      : after.tables[tableId]?.name

  if (data === undefined) return null

  return {
    kind: 'table-name',
    status,
    data,
    tableId,
  }
}
