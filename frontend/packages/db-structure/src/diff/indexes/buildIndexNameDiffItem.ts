import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { IndexNameDiffItem } from '../types.js'
import { getChangeStatus } from '../utils/getChangeStatus.js'

export function buildIndexNameDiffItem(
  tableId: string,
  indexId: string,
  before: Schema,
  after: Schema,
  operations: Operation[],
): IndexNameDiffItem | null {
  const status = getChangeStatus({
    tableId,
    indexId,
    operations,
    pathRegExp: PATH_PATTERNS.INDEX_NAME,
  })
  if (status === 'unchanged') return null

  const data =
    status === 'removed'
      ? before.tables[tableId]?.indexes[indexId]?.name
      : after.tables[tableId]?.indexes[indexId]?.name

  if (data === undefined) return null

  return {
    kind: 'index-name',
    status,
    data,
    tableId,
    indexId,
  }
}
