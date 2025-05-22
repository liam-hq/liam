import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { IndexColumnsDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildIndexColumnsDiffItem(
  tableId: string,
  indexId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): IndexColumnsDiffItem | null {
  const status = getChangeStatus({
    tableId,
    indexId,
    operations,
    pathRegExp: PATH_PATTERNS.INDEX_COLUMNS,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.indexes[indexId]?.columns
      : after.tables[tableId]?.indexes[indexId]?.columns

  if (data === undefined) return null

  return {
    kind: 'index-columns',
    status,
    data,
    tableId,
    indexId,
  }
}
