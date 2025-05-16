import { compare } from 'fast-json-patch'
import type { Schema } from '../schema/index.js'
import { buildTableCommentDiffItem } from './tables/buildTableCommentDiffItem.js'
import { buildTableDiffItem } from './tables/buildTableDiffItem.js'
import { buildTableNameDiffItem } from './tables/buildTableNameDiffItem.js'
import type { SchemaDiffItem } from './types.js'

export function buildSchemaDiff(
  before: Schema,
  after: Schema,
): SchemaDiffItem[] {
  const items: SchemaDiffItem[] = []

  const operations = compare(before, after)
  const allTableIds = [
    ...new Set([
      ...Object.keys(before.tables || {}),
      ...Object.keys(after.tables || {}),
    ]),
  ]

  for (const tableId of allTableIds) {
    const tableDiffItem = buildTableDiffItem(tableId, before, after, operations)
    if (tableDiffItem) {
      items.push(tableDiffItem)
    }

    const tableNameDiffItem = buildTableNameDiffItem(
      tableId,
      before,
      after,
      operations,
    )
    if (tableNameDiffItem) {
      items.push(tableNameDiffItem)
    }

    const tableCommentDiffItem = buildTableCommentDiffItem(
      tableId,
      before,
      after,
      operations,
    )
    if (tableCommentDiffItem) {
      items.push(tableCommentDiffItem)
    }
  }

  return items
}
