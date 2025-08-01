import {
  type ChangeStatus,
  type SchemaDiffItem,
  tableCommentDiffItemSchema,
  tableDiffItemSchema,
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

  // Check for table comment changes as secondary priority
  const tableCommentDiffItem = filteredDiffItems.find((item) => {
    const parsed = safeParse(tableCommentDiffItemSchema, item)
    return parsed.success
  })

  if (tableCommentDiffItem) {
    return tableCommentDiffItem.status
  }

  return 'unchanged'
}
