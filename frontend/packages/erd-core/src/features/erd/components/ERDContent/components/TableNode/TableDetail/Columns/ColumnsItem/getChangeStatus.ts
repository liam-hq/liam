import {
  type ChangeStatus,
  columnRelatedDiffItemSchema,
  type SchemaDiffItem,
  tableDiffItemSchema,
} from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

type Params = {
  tableId: string
  columnId: string
  diffItems: SchemaDiffItem[]
}

export function getChangeStatus({
  tableId,
  columnId,
  diffItems,
}: Params): ChangeStatus {
  const filteredDiffItems = diffItems.filter((d) => d.tableId === tableId)

  // Priority 1: Check for table-level changes (added/removed)
  // If the table itself has been added or removed, return that status immediately
  const tableRelatedDiffItem = filteredDiffItems.find((item) => {
    const parsed = safeParse(tableDiffItemSchema, item)
    return parsed.success
  })

  if (tableRelatedDiffItem) {
    return tableRelatedDiffItem.status
  }

  const columnRelatedDiffItems = filteredDiffItems.filter((item) => {
    const parsed = safeParse(columnRelatedDiffItemSchema, item)
    return parsed.success && parsed.output.columnId === columnId
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
