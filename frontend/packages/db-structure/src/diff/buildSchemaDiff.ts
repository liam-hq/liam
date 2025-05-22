import { compare } from 'fast-json-patch'
import type { Schema } from '../schema/index.js'
import { buildColumnCheckDiffItem } from './columns/buildColumnCheckDiffItem.js'
import { buildColumnCommentDiffItem } from './columns/buildColumnCommentDiffItem.js'
import { buildColumnDefaultDiffItem } from './columns/buildColumnDefaultDiffItem.js'
import { buildColumnDiffItem } from './columns/buildColumnDiffItem.js'
import { buildColumnNameDiffItem } from './columns/buildColumnNameDiffItem.js'
import { buildColumnNotNullDiffItem } from './columns/buildColumnNotNullDiffItem.js'
import { buildColumnPrimaryDiffItem } from './columns/buildColumnPrimaryDiffItem.js'
import { buildColumnUniqueDiffItem } from './columns/buildColumnUniqueDiffItem.js'
import { buildIndexColumnsDiffItem } from './indexes/buildIndexColumnsDiffItem.js'
import { buildIndexDiffItem } from './indexes/buildIndexDiffItem.js'
import { buildIndexNameDiffItem } from './indexes/buildIndexNameDiffItem.js'
import { buildIndexTypeDiffItem } from './indexes/buildIndexTypeDiffItem.js'
import { buildIndexUniqueDiffItem } from './indexes/buildIndexUniqueDiffItem.js'
import { buildTableCommentDiffItem } from './tables/buildTableCommentDiffItem.js'
import { buildTableDiffItem } from './tables/buildTableDiffItem.js'
import { buildTableNameDiffItem } from './tables/buildTableNameDiffItem.js'
import type {
  ColumnRelatedDiffItem,
  IndexRelatedDiffItem,
  SchemaDiffItem,
  TableRelatedDiffItem,
} from './types.js'

function buildTableRelatedDiffItems(
  tableId: string,
  before: Schema,
  after: Schema,
  operations: ReturnType<typeof compare>,
): TableRelatedDiffItem[] {
  const items: TableRelatedDiffItem[] = []

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

  return items
}

function buildColumnRelatedDiffItems(
  tableId: string,
  columnId: string,
  before: Schema,
  after: Schema,
  operations: ReturnType<typeof compare>,
): ColumnRelatedDiffItem[] {
  const items: ColumnRelatedDiffItem[] = []

  const columnDiffItem = buildColumnDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnDiffItem) {
    items.push(columnDiffItem)
  }

  const columnNameDiffItem = buildColumnNameDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnNameDiffItem) {
    items.push(columnNameDiffItem)
  }

  const columnCommentDiffItem = buildColumnCommentDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnCommentDiffItem) {
    items.push(columnCommentDiffItem)
  }

  const columnPrimaryDiffItem = buildColumnPrimaryDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnPrimaryDiffItem) {
    items.push(columnPrimaryDiffItem)
  }

  const columnDefaultDiffItem = buildColumnDefaultDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnDefaultDiffItem) {
    items.push(columnDefaultDiffItem)
  }

  const columnCheckDiffItem = buildColumnCheckDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnCheckDiffItem) {
    items.push(columnCheckDiffItem)
  }

  const columnUniqueDiffItem = buildColumnUniqueDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnUniqueDiffItem) {
    items.push(columnUniqueDiffItem)
  }

  const columnNotNullDiffItem = buildColumnNotNullDiffItem(
    tableId,
    columnId,
    before,
    after,
    operations,
  )
  if (columnNotNullDiffItem) {
    items.push(columnNotNullDiffItem)
  }

  return items
}

function buildIndexRelatedDiffItems(
  tableId: string,
  indexId: string,
  before: Schema,
  after: Schema,
  operations: ReturnType<typeof compare>,
): IndexRelatedDiffItem[] {
  const items: IndexRelatedDiffItem[] = []

  const indexDiffItem = buildIndexDiffItem(
    tableId,
    indexId,
    before,
    after,
    operations,
  )
  if (indexDiffItem) {
    items.push(indexDiffItem)
  }

  const indexNameDiffItem = buildIndexNameDiffItem(
    tableId,
    indexId,
    before,
    after,
    operations,
  )
  if (indexNameDiffItem) {
    items.push(indexNameDiffItem)
  }

  const indexUniqueDiffItem = buildIndexUniqueDiffItem(
    tableId,
    indexId,
    before,
    after,
    operations,
  )
  if (indexUniqueDiffItem) {
    items.push(indexUniqueDiffItem)
  }

  const indexColumnsDiffItem = buildIndexColumnsDiffItem(
    tableId,
    indexId,
    before,
    after,
    operations,
  )
  if (indexColumnsDiffItem) {
    items.push(indexColumnsDiffItem)
  }

  const indexTypeDiffItem = buildIndexTypeDiffItem(
    tableId,
    indexId,
    before,
    after,
    operations,
  )
  if (indexTypeDiffItem) {
    items.push(indexTypeDiffItem)
  }

  return items
}

export function buildSchemaDiff(
  before: Schema,
  after: Schema,
): SchemaDiffItem[] {
  const items: SchemaDiffItem[] = []
  const operations = compare(before, after)
  const allTables = Object.values({ ...before.tables, ...after.tables })

  for (const table of allTables) {
    const tableId = table.name

    const tableDiffItems = buildTableRelatedDiffItems(
      tableId,
      before,
      after,
      operations,
    )
    items.push(...tableDiffItems)

    for (const column of Object.values(table.columns)) {
      const columnId = column.name
      const columnDiffItems = buildColumnRelatedDiffItems(
        tableId,
        columnId,
        before,
        after,
        operations,
      )
      items.push(...columnDiffItems)
    }

    for (const index of Object.values(table.indexes)) {
      const indexId = index.name
      const indexDiffItems = buildIndexRelatedDiffItems(
        tableId,
        indexId,
        before,
        after,
        operations,
      )
      items.push(...indexDiffItems)
    }
  }

  return items
}
