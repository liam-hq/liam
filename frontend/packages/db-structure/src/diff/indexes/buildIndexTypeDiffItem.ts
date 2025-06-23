import type { Operation } from 'fast-json-patch'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type { Schema } from '../../schema/index.js'
import type { IndexTypeDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildIndexTypeDiffItem(
  tableId: string,
  indexId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): IndexTypeDiffItem | null {
  const status = getChangeStatus({
    tableId,
    indexId,
    operations,
    pathRegExp: PATH_PATTERNS.INDEX_TYPE,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.indexes[indexId]?.type
      : after.tables[tableId]?.indexes[indexId]?.type

  if (data === undefined) return null

  return {
    kind: 'index-type',
    status,
    data,
    tableId,
    indexId,
  }
}
