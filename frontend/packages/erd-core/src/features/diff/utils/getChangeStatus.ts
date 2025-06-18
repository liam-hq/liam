import type {
  SchemaDiffItem,
  TableRelatedDiffItem,
} from '@liam-hq/db-structure'

type Params = {
  tableId: string
  diffItems: SchemaDiffItem[]
  kind: TableRelatedDiffItem['kind']
}

export function getChangeStatus({ tableId, diffItems, kind }: Params) {
  const status =
    diffItems.find((item) => item.kind === kind && item.tableId === tableId)
      ?.status ?? 'unchanged'

  return status
}
