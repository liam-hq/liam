import {
  type InferOutput,
  array,
  literal,
  object,
  picklist,
  string,
  union,
} from 'valibot'
import {
  checkConstraintDetailSchema,
  columnCheckSchema,
  columnDefaultSchema,
  columnNameSchema,
  columnNotNullSchema,
  columnPrimarySchema,
  columnSchema,
  columnUniqueSchema,
  commentSchema,
  constraintNameSchema,
  constraintSchema,
  foreignKeyConstraintReferenceOptionSchema,
  indexColumnsSchema,
  indexNameSchema,
  indexSchema,
  indexTypeSchema,
  indexUniqueSchema,
  tableNameSchema,
  tableSchema,
} from '../schema/index.js'

const changeStatusSchema = picklist([
  'added',
  'removed',
  'modified',
  'unchanged',
])
export type ChangeStatus = InferOutput<typeof changeStatusSchema>

const baseSchemaDiffItemSchema = object({
  status: changeStatusSchema,
  tableId: string(),
})

const tableDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('table'),
  data: tableSchema,
})
export type TableDiffItem = InferOutput<typeof tableDiffItemSchema>

const tableNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('table-name'),
  data: tableNameSchema,
})
export type TableNameDiffItem = InferOutput<typeof tableNameDiffItemSchema>

const tableCommentDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('table-comment'),
  data: commentSchema,
})
export type TableCommentDiffItem = InferOutput<
  typeof tableCommentDiffItemSchema
>

const columnDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column'),
  data: columnSchema,
  columnId: string(),
})
export type ColumnDiffItem = InferOutput<typeof columnDiffItemSchema>

const columnNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-name'),
  data: columnNameSchema,
  columnId: string(),
})
export type ColumnNameDiffItem = InferOutput<typeof columnNameDiffItemSchema>

const columnCommentDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-comment'),
  data: commentSchema,
  columnId: string(),
})
export type ColumnCommentDiffItem = InferOutput<
  typeof columnCommentDiffItemSchema
>

const columnPrimaryDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-primary'),
  data: columnPrimarySchema,
  columnId: string(),
})
export type ColumnPrimaryDiffItem = InferOutput<
  typeof columnPrimaryDiffItemSchema
>

const columnDefaultDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-default'),
  data: columnDefaultSchema,
  columnId: string(),
})
export type ColumnDefaultDiffItem = InferOutput<
  typeof columnDefaultDiffItemSchema
>

const columnCheckDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-check'),
  data: columnCheckSchema,
  columnId: string(),
})
export type ColumnCheckDiffItem = InferOutput<typeof columnCheckDiffItemSchema>

const columnUniqueDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-unique'),
  data: columnUniqueSchema,
  columnId: string(),
})
export type ColumnUniqueDiffItem = InferOutput<
  typeof columnUniqueDiffItemSchema
>

const columnNotNullDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('column-not-null'),
  data: columnNotNullSchema,
  columnId: string(),
})
export type ColumnNotNullDiffItem = InferOutput<
  typeof columnNotNullDiffItemSchema
>

const indexDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('index'),
  data: indexSchema,
  indexId: string(),
})
export type IndexDiffItem = InferOutput<typeof indexDiffItemSchema>

const indexNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('index-name'),
  data: indexNameSchema,
  indexId: string(),
})
export type IndexNameDiffItem = InferOutput<typeof indexNameDiffItemSchema>

const indexUniqueDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('index-unique'),
  data: indexUniqueSchema,
  indexId: string(),
})
export type IndexUniqueDiffItem = InferOutput<typeof indexUniqueDiffItemSchema>

const indexColumnsDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('index-columns'),
  data: indexColumnsSchema,
  indexId: string(),
})
export type IndexColumnsDiffItem = InferOutput<
  typeof indexColumnsDiffItemSchema
>

const indexTypeDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('index-type'),
  data: indexTypeSchema,
  indexId: string(),
})
export type IndexTypeDiffItem = InferOutput<typeof indexTypeDiffItemSchema>

const constraintDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint'),
  data: constraintSchema,
  constraintId: string(),
})
export type ConstraintDiffItem = InferOutput<typeof constraintDiffItemSchema>

const constraintNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-name'),
  data: constraintNameSchema,
  constraintId: string(),
})
export type ConstraintNameDiffItem = InferOutput<
  typeof constraintNameDiffItemSchema
>

const constraintColumnNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-column-name'),
  data: columnNameSchema,
  constraintId: string(),
})
export type ConstraintColumnNameDiffItem = InferOutput<
  typeof constraintColumnNameDiffItemSchema
>

const constraintTargetTableNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-target-table-name'),
  data: tableNameSchema,
  constraintId: string(),
})
export type ConstraintTargetTableNameDiffItem = InferOutput<
  typeof constraintTargetTableNameDiffItemSchema
>

const constraintTargetColumnNameDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-target-column-name'),
  data: columnNameSchema,
  constraintId: string(),
})
export type ConstraintTargetColumnNameDiffItem = InferOutput<
  typeof constraintTargetColumnNameDiffItemSchema
>

const constraintUpdateConstraintDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-update-constraint'),
  data: foreignKeyConstraintReferenceOptionSchema,
  constraintId: string(),
})
export type ConstraintUpdateConstraintDiffItem = InferOutput<
  typeof constraintUpdateConstraintDiffItemSchema
>

const constraintDeleteConstraintDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-delete-constraint'),
  data: foreignKeyConstraintReferenceOptionSchema,
  constraintId: string(),
})
export type ConstraintDeleteConstraintDiffItem = InferOutput<
  typeof constraintDeleteConstraintDiffItemSchema
>

const constraintDetailDiffItemSchema = object({
  ...baseSchemaDiffItemSchema.entries,
  kind: literal('constraint-detail'),
  data: checkConstraintDetailSchema,
  constraintId: string(),
})
export type ConstraintDetailDiffItem = InferOutput<
  typeof constraintDetailDiffItemSchema
>

const tableRelatedDiffItemSchema = union([
  tableDiffItemSchema,
  tableNameDiffItemSchema,
  tableCommentDiffItemSchema,
])
export type TableRelatedDiffItem = InferOutput<
  typeof tableRelatedDiffItemSchema
>

const columnRelatedDiffItemSchema = union([
  columnDiffItemSchema,
  columnNameDiffItemSchema,
  columnCommentDiffItemSchema,
  columnPrimaryDiffItemSchema,
  columnDefaultDiffItemSchema,
  columnCheckDiffItemSchema,
  columnUniqueDiffItemSchema,
  columnNotNullDiffItemSchema,
])
export type ColumnRelatedDiffItem = InferOutput<
  typeof columnRelatedDiffItemSchema
>

const indexRelatedDiffItemSchema = union([
  indexDiffItemSchema,
  indexNameDiffItemSchema,
  indexUniqueDiffItemSchema,
  indexColumnsDiffItemSchema,
  indexTypeDiffItemSchema,
])
export type IndexRelatedDiffItem = InferOutput<
  typeof indexRelatedDiffItemSchema
>

const constraintRelatedDiffItemSchema = union([
  constraintDiffItemSchema,
  constraintNameDiffItemSchema,
  constraintColumnNameDiffItemSchema,
  constraintTargetTableNameDiffItemSchema,
  constraintTargetColumnNameDiffItemSchema,
  constraintUpdateConstraintDiffItemSchema,
  constraintDeleteConstraintDiffItemSchema,
  constraintDetailDiffItemSchema,
])
export type ConstraintRelatedDiffItem = InferOutput<
  typeof constraintRelatedDiffItemSchema
>

const schemaDiffItemSchema = union([
  tableRelatedDiffItemSchema,
  columnRelatedDiffItemSchema,
  indexRelatedDiffItemSchema,
  constraintRelatedDiffItemSchema,
])
export type SchemaDiffItem = InferOutput<typeof schemaDiffItemSchema>

export const schemaDiffItemsSchema = array(schemaDiffItemSchema)
