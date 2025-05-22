import type {
  Column,
  ColumnCheck,
  ColumnDefault,
  ColumnName,
  ColumnNotNull,
  ColumnPrimary,
  ColumnUnique,
  Comment,
  Index,
  IndexColumns,
  IndexName,
  IndexType,
  IndexUnique,
  Table,
  TableName,
} from '../schema/index.js'

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

export type ColumnDiffItem = BaseSchemaDiffItem & {
  kind: 'column'
  data: Column
  columnId: string
}

export type ColumnNameDiffItem = BaseSchemaDiffItem & {
  kind: 'column-name'
  data: ColumnName
  columnId: string
}

export type ColumnCommentDiffItem = BaseSchemaDiffItem & {
  kind: 'column-comment'
  data: Comment
  columnId: string
}

export type ColumnPrimaryDiffItem = BaseSchemaDiffItem & {
  kind: 'column-primary'
  data: ColumnPrimary
  columnId: string
}

export type ColumnDefaultDiffItem = BaseSchemaDiffItem & {
  kind: 'column-default'
  data: ColumnDefault
  columnId: string
}

export type ColumnCheckDiffItem = BaseSchemaDiffItem & {
  kind: 'column-check'
  data: ColumnCheck
  columnId: string
}

export type ColumnUniqueDiffItem = BaseSchemaDiffItem & {
  kind: 'column-unique'
  data: ColumnUnique
  columnId: string
}

export type ColumnNotNullDiffItem = BaseSchemaDiffItem & {
  kind: 'column-not-null'
  data: ColumnNotNull
  columnId: string
}

export type IndexDiffItem = BaseSchemaDiffItem & {
  kind: 'index'
  data: Index
  indexId: string
}

export type IndexNameDiffItem = BaseSchemaDiffItem & {
  kind: 'index-name'
  data: IndexName
  indexId: string
}

export type IndexUniqueDiffItem = BaseSchemaDiffItem & {
  kind: 'index-unique'
  data: IndexUnique
  indexId: string
}

export type IndexColumnsDiffItem = BaseSchemaDiffItem & {
  kind: 'index-columns'
  data: IndexColumns
  indexId: string
}

export type IndexTypeDiffItem = BaseSchemaDiffItem & {
  kind: 'index-type'
  data: IndexType
  indexId: string
}

export type TableRelatedDiffItem =
  | TableDiffItem
  | TableNameDiffItem
  | TableCommentDiffItem

export type ColumnRelatedDiffItem =
  | ColumnDiffItem
  | ColumnNameDiffItem
  | ColumnCommentDiffItem
  | ColumnPrimaryDiffItem
  | ColumnDefaultDiffItem
  | ColumnCheckDiffItem
  | ColumnUniqueDiffItem
  | ColumnNotNullDiffItem

export type IndexRelatedDiffItem =
  | IndexDiffItem
  | IndexNameDiffItem
  | IndexUniqueDiffItem
  | IndexColumnsDiffItem
  | IndexTypeDiffItem

export type SchemaDiffItem =
  | TableRelatedDiffItem
  | ColumnRelatedDiffItem
  | IndexRelatedDiffItem
