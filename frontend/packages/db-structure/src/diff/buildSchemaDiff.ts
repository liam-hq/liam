import pkg from 'fast-json-patch'

const { compare } = pkg

import type { Schema } from '../schema/index.js'
import { buildColumnCheckDiffItem } from './columns/buildColumnCheckDiffItem.js'
import { buildColumnCommentDiffItem } from './columns/buildColumnCommentDiffItem.js'
import { buildColumnDefaultDiffItem } from './columns/buildColumnDefaultDiffItem.js'
import { buildColumnDiffItem } from './columns/buildColumnDiffItem.js'
import { buildColumnNameDiffItem } from './columns/buildColumnNameDiffItem.js'
import { buildColumnNotNullDiffItem } from './columns/buildColumnNotNullDiffItem.js'
import { buildConstraintColumnNameDiffItem } from './constraints/buildConstraintColumnNameDiffItem.js'
import { buildConstraintDeleteConstraintDiffItem } from './constraints/buildConstraintDeleteConstraintDiffItem.js'
import { buildConstraintDetailDiffItem } from './constraints/buildConstraintDetailDiffItem.js'
import { buildConstraintDiffItem } from './constraints/buildConstraintDiffItem.js'
import { buildConstraintNameDiffItem } from './constraints/buildConstraintNameDiffItem.js'
import { buildConstraintTargetColumnNameDiffItem } from './constraints/buildConstraintTargetColumnNameDiffItem.js'
import { buildConstraintTargetTableNameDiffItem } from './constraints/buildConstraintTargetTableNameDiffItem.js'
import { buildConstraintUpdateConstraintDiffItem } from './constraints/buildConstraintUpdateConstraintDiffItem.js'
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
  ConstraintRelatedDiffItem,
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

function buildConstraintRelatedDiffItems(
  tableId: string,
  constraintId: string,
  before: Schema,
  after: Schema,
  operations: ReturnType<typeof compare>,
): ConstraintRelatedDiffItem[] {
  const items: ConstraintRelatedDiffItem[] = []

  const constraintDiffItem = buildConstraintDiffItem(
    tableId,
    constraintId,
    before,
    after,
    operations,
  )
  if (constraintDiffItem) {
    items.push(constraintDiffItem)
  }

  const constraintNameDiffItem = buildConstraintNameDiffItem(
    tableId,
    constraintId,
    before,
    after,
    operations,
  )
  if (constraintNameDiffItem) {
    items.push(constraintNameDiffItem)
  }

  const constraintColumnNameDiffItem = buildConstraintColumnNameDiffItem(
    tableId,
    constraintId,
    before,
    after,
    operations,
  )
  if (constraintColumnNameDiffItem) {
    items.push(constraintColumnNameDiffItem)
  }

  const constraintTargetTableNameDiffItem =
    buildConstraintTargetTableNameDiffItem(
      tableId,
      constraintId,
      before,
      after,
      operations,
    )
  if (constraintTargetTableNameDiffItem) {
    items.push(constraintTargetTableNameDiffItem)
  }

  const constraintTargetColumnNameDiffItem =
    buildConstraintTargetColumnNameDiffItem(
      tableId,
      constraintId,
      before,
      after,
      operations,
    )
  if (constraintTargetColumnNameDiffItem) {
    items.push(constraintTargetColumnNameDiffItem)
  }

  const constraintUpdateConstraintDiffItem =
    buildConstraintUpdateConstraintDiffItem(
      tableId,
      constraintId,
      before,
      after,
      operations,
    )
  if (constraintUpdateConstraintDiffItem) {
    items.push(constraintUpdateConstraintDiffItem)
  }

  const constraintDeleteConstraintDiffItem =
    buildConstraintDeleteConstraintDiffItem(
      tableId,
      constraintId,
      before,
      after,
      operations,
    )
  if (constraintDeleteConstraintDiffItem) {
    items.push(constraintDeleteConstraintDiffItem)
  }

  const constraintDetailDiffItem = buildConstraintDetailDiffItem(
    tableId,
    constraintId,
    before,
    after,
    operations,
  )
  if (constraintDetailDiffItem) {
    items.push(constraintDetailDiffItem)
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

    const beforeColumns = before.tables[tableId]?.columns || {}
    const afterColumns = after.tables[tableId]?.columns || {}
    const allColumnIds = new Set([
      ...Object.keys(beforeColumns),
      ...Object.keys(afterColumns),
    ])
    for (const columnId of allColumnIds) {
      const columnDiffItems = buildColumnRelatedDiffItems(
        tableId,
        columnId,
        before,
        after,
        operations,
      )
      items.push(...columnDiffItems)
    }

    const beforeIndexes = before.tables[tableId]?.indexes || {}
    const afterIndexes = after.tables[tableId]?.indexes || {}
    const allIndexIds = new Set([
      ...Object.keys(beforeIndexes),
      ...Object.keys(afterIndexes),
    ])
    for (const indexId of allIndexIds) {
      const indexDiffItems = buildIndexRelatedDiffItems(
        tableId,
        indexId,
        before,
        after,
        operations,
      )
      items.push(...indexDiffItems)
    }

    const beforeConstraints = before.tables[tableId]?.constraints || {}
    const afterConstraints = after.tables[tableId]?.constraints || {}
    const allConstraintIds = new Set([
      ...Object.keys(beforeConstraints),
      ...Object.keys(afterConstraints),
    ])

    for (const constraintId of allConstraintIds) {
      const constraintDiffItems = buildConstraintRelatedDiffItems(
        tableId,
        constraintId,
        before,
        after,
        operations,
      )
      items.push(...constraintDiffItems)
    }
  }

  return items
}
