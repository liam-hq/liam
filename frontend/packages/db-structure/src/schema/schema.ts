import * as v from 'valibot'

// Export these schema definitions
export const columnNameSchema = v.string()

export const columnDefaultSchema = v.nullable(
  v.union([v.string(), v.number(), v.boolean()]),
)

export const columnCheckSchema = v.nullable(v.string())

export const columnNotNullSchema = v.boolean()

export const tableNameSchema = v.string()

export const commentSchema = v.nullable(v.string())

export const constraintNameSchema = v.string()

export const columnSchema = v.object({
  name: columnNameSchema,
  type: v.string(),
  default: columnDefaultSchema,
  check: columnCheckSchema,
  notNull: columnNotNullSchema,
  comment: commentSchema,
})

const columnsSchema = v.record(columnNameSchema, columnSchema)
export type Columns = v.InferOutput<typeof columnsSchema>
export type Column = v.InferOutput<typeof columnSchema>

export const indexNameSchema = v.string()

export const indexUniqueSchema = v.boolean()

export const indexColumnsSchema = v.array(v.string())

export const indexTypeSchema = v.string()

export const indexSchema = v.object({
  name: indexNameSchema,
  unique: indexUniqueSchema,
  columns: indexColumnsSchema,
  type: indexTypeSchema,
})
export type Index = v.InferOutput<typeof indexSchema>

const indexesSchema = v.record(indexNameSchema, indexSchema)
export type Indexes = v.InferOutput<typeof indexesSchema>

export const foreignKeyConstraintReferenceOptionSchema = v.picklist([
  'CASCADE',
  'RESTRICT',
  'SET_NULL',
  'SET_DEFAULT',
  'NO_ACTION',
])
export type ForeignKeyConstraintReferenceOption = v.InferOutput<
  typeof foreignKeyConstraintReferenceOptionSchema
>

const primaryKeyConstraintSchema = v.object({
  type: v.literal('PRIMARY KEY'),
  name: constraintNameSchema,
  columnName: columnNameSchema,
})
export type PrimaryKeyConstraint = v.InferOutput<
  typeof primaryKeyConstraintSchema
>

export const foreignKeyConstraintSchema = v.object({
  type: v.literal('FOREIGN KEY'),
  name: constraintNameSchema,
  columnName: columnNameSchema,
  targetTableName: tableNameSchema,
  targetColumnName: columnNameSchema,
  updateConstraint: foreignKeyConstraintReferenceOptionSchema,
  deleteConstraint: foreignKeyConstraintReferenceOptionSchema,
})
export type ForeignKeyConstraint = v.InferOutput<
  typeof foreignKeyConstraintSchema
>

/**
 * Valid reference options for Google Cloud Spanner interleave constraints
 *
 * Spanner interleave constraints only support CASCADE and NO_ACTION for delete operations.
 * Update operations are always NO_ACTION.
 */
const interleaveConstraintReferenceOptionSchema = v.picklist([
  'CASCADE',
  'NO_ACTION',
])
export type InterleaveConstraintReferenceOption = v.InferOutput<
  typeof interleaveConstraintReferenceOptionSchema
>

/**
 * Schema for Google Cloud Spanner interleave constraints
 *
 * Interleave constraints define parent-child table relationships where child rows
 * are physically co-located with parent rows for better query performance.
 *
 * @see {@link https://cloud.google.com/spanner/docs/schema-and-data-model#creating-interleaved-tables}
 */
export const interleaveConstraintSchema = v.object({
  type: v.literal('INTERLEAVE'),
  name: constraintNameSchema,
  columnName: columnNameSchema,
  targetTableName: tableNameSchema,
  targetColumnName: columnNameSchema,
  updateConstraint: v.literal('NO_ACTION'),
  deleteConstraint: interleaveConstraintReferenceOptionSchema,
})
export type InterleaveConstraint = v.InferOutput<
  typeof interleaveConstraintSchema
>

const uniqueConstraintSchema = v.object({
  type: v.literal('UNIQUE'),
  name: constraintNameSchema,
  columnName: columnNameSchema,
})
export type UniqueConstraint = v.InferOutput<typeof uniqueConstraintSchema>

export const checkConstraintDetailSchema = v.string()

const checkConstraintSchema = v.object({
  type: v.literal('CHECK'),
  name: constraintNameSchema,
  detail: checkConstraintDetailSchema,
})
export type CheckConstraint = v.InferOutput<typeof checkConstraintSchema>

export const constraintSchema = v.union([
  primaryKeyConstraintSchema,
  foreignKeyConstraintSchema,
  uniqueConstraintSchema,
  checkConstraintSchema,
  interleaveConstraintSchema,
])
export type Constraint = v.InferOutput<typeof constraintSchema>

const constraintsSchema = v.record(constraintNameSchema, constraintSchema)
export type Constraints = v.InferOutput<typeof constraintsSchema>

export const tableSchema = v.object({
  name: tableNameSchema,
  columns: columnsSchema,
  comment: commentSchema,
  indexes: indexesSchema,
  constraints: constraintsSchema,
})
export type Table = v.InferOutput<typeof tableSchema>

const tablesSchema = v.record(tableNameSchema, tableSchema)
export type Tables = v.InferOutput<typeof tablesSchema>

// Schema definition for the entire database structure
export const schemaSchema = v.object({
  tables: tablesSchema,
})

export type Schema = v.InferOutput<typeof schemaSchema>
