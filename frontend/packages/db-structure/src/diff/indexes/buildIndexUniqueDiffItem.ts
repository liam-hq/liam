import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { IndexUniqueDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildIndexUniqueDiffItem(
  tableId: string,
  indexId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): IndexUniqueDiffItem | null {
  const status = getChangeStatus({
    tableId,
    indexId,
    operations,
    pathRegExp: PATH_PATTERNS.INDEX_UNIQUE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.indexes[indexId]?.unique
      : after.tables[tableId]?.indexes[indexId]?.unique

  if (data === undefined) return null

  return {
    kind: 'index-unique',
    status,
    data,
    tableId,
    indexId,
  }
}
