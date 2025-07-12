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
  columnNames: v.array(columnNameSchema),
})
export type PrimaryKeyConstraint = v.InferOutput<
  typeof primaryKeyConstraintSchema
>

export const foreignKeyConstraintSchema = v.object({
  type: v.literal('FOREIGN KEY'),
  name: constraintNameSchema,
  columnNames: v.array(columnNameSchema),
  targetTableName: tableNameSchema,
  targetColumnNames: v.array(columnNameSchema),
  updateConstraint: foreignKeyConstraintReferenceOptionSchema,
  deleteConstraint: foreignKeyConstraintReferenceOptionSchema,
})
export type ForeignKeyConstraint = v.InferOutput<
  typeof foreignKeyConstraintSchema
>

const uniqueConstraintSchema = v.object({
  type: v.literal('UNIQUE'),
  name: constraintNameSchema,
  columnNames: v.array(columnNameSchema),
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
