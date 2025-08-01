import {
  type ChangeStatus,
  columnRelatedDiffItemSchema,
  type SchemaDiffItem,
  tableDiffItemSchema,
} from '@liam-hq/db-structure'
import { safeParse, union } from 'valibot'

type Params = {
  tableId: string
  diffItems: SchemaDiffItem[]
}

export function getChangeStatus({ tableId, diffItems }: Params): ChangeStatus {
  const filteredDiffItems = diffItems.filter((d) => d.tableId === tableId)

  // Priority 1: Check for table-level changes (added/removed)
  // If the table itself has been added or removed, return that status immediately
  const tableRelatedDiffItemSchema = union([tableDiffItemSchema])
  const tableRelatedDiffItem = filteredDiffItems.find((item) => {
    const parsed = safeParse(tableRelatedDiffItemSchema, item)
    return parsed.success
  })

  if (tableRelatedDiffItem) {
    return tableRelatedDiffItem.status
  }

  // Priority 2: Analyze column-level changes to determine the table's change status
  // Strategy:
  // - If all column changes have the same status -> return that status
  // - If column changes have mixed statuses -> return 'modified'
  // - If no column changes exist -> return 'unchanged'
  const columnRelatedDiffItems = filteredDiffItems.filter((item) => {
    const parsed = safeParse(columnRelatedDiffItemSchema, item)
    return parsed.success
  })

  if (columnRelatedDiffItems.length === 0) {
    return 'unchanged'
  }

  // Collect all unique statuses from column changes
  const statuses = columnRelatedDiffItems.map((item) => item.status)
  const uniqueStatuses = new Set(statuses)

  // All columns have the same change status
  if (uniqueStatuses.size === 1) {
    return statuses[0] as ChangeStatus
  }

  // Mixed statuses indicate the table has been modified
  return 'modified'
}
