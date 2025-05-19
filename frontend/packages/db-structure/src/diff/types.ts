import type { Comment, Table, TableName } from '../schema/index.js'

export type ChangeStatus = 'added' | 'removed' | 'modified' | 'unchanged'

type BaseSchemaDiffItem = {
  status: ChangeStatus
  tableId: string
}

export type TableDiffItem = BaseSchemaDiffItem & {
  kind: 'table'
  data: Table
}

export type TableNameDiffItem = BaseSchemaDiffItem & {
  kind: 'table-name'
  data: TableName
}

export type TableCommentDiffItem = BaseSchemaDiffItem & {
  kind: 'table-comment'
  data: Comment
}

export type SchemaDiffItem =
  | TableDiffItem
  | TableNameDiffItem
  | TableCommentDiffItem
