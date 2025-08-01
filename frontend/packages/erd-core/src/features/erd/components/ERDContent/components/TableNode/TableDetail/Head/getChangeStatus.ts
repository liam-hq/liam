import {
  type ChangeStatus,
  type SchemaDiffItem,
  tableDiffItemSchema,
  tableNameDiffItemSchema,
} from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

type Params = {
  tableId: string
  diffItems: SchemaDiffItem[]
}

export function getChangeStatus({ tableId, diffItems }: Params): ChangeStatus {
  const filteredDiffItems = diffItems.filter((d) => d.tableId === tableId)

  // Prioritize table-level changes (added/removed) if they exist
  const tableDiffItem = filteredDiffItems.find((item) => {
    const parsed = safeParse(tableDiffItemSchema, item)
    return parsed.success
  })

  if (tableDiffItem) {
    return tableDiffItem.status
  }

  // Check for table name changes as secondary priority
  const tableNameDiffItem = filteredDiffItems.find((item) => {
    const parsed = safeParse(tableNameDiffItemSchema, item)
    return parsed.success
  })

  if (tableNameDiffItem) {
    return tableNameDiffItem.status
  }

  return 'unchanged'
}
