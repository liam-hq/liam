import * as v from 'valibot'

// Export these schema definitions
export const columnNameSchema = v.string()

export const tableNameSchema = v.string()

export const indexNameSchema = v.string()

export const relationshipNameSchema = v.string()

export const columnSchema = v.object({
  name: columnNameSchema,
  type: v.string(),
  default: v.nullable(v.union([v.string(), v.number(), v.boolean()])),
  check: v.nullable(v.string()),
  primary: v.boolean(),
  unique: v.boolean(),
  notNull: v.boolean(),
  comment: v.nullable(v.string()),
})

const columnsSchema = v.record(columnNameSchema, columnSchema)
export type Columns = v.InferOutput<typeof columnsSchema>
export type Column = v.InferOutput<typeof columnSchema>

const indexSchema = v.object({
  name: v.string(),
  unique: v.boolean(),
  columns: v.array(v.string()),
})
export type Index = v.InferOutput<typeof indexSchema>

const indexesSchema = v.record(indexNameSchema, indexSchema)
export type Indexes = v.InferOutput<typeof indexesSchema>

export const tableSchema = v.object({
  name: tableNameSchema,
  columns: columnsSchema,
  comment: v.nullable(v.string()),
  indexes: indexesSchema,
})

export type Table = v.InferOutput<typeof tableSchema>

const cardinalitySchema = v.picklist(['ONE_TO_ONE', 'ONE_TO_MANY'])
export type Cardinality = v.InferOutput<typeof cardinalitySchema>

const foreignKeyConstraintSchema = v.picklist([
  'CASCADE',
  'RESTRICT',
  'SET_NULL',
  'SET_DEFAULT',
  'NO_ACTION',
])

export type ForeignKeyConstraint = v.InferOutput<
  typeof foreignKeyConstraintSchema
>

export const relationshipSchema = v.object({
  name: relationshipNameSchema,
  primaryTableName: tableNameSchema,
  primaryColumnName: columnNameSchema,
  foreignTableName: tableNameSchema,
  foreignColumnName: columnNameSchema,
  cardinality: cardinalitySchema,
  updateConstraint: foreignKeyConstraintSchema,
  deleteConstraint: foreignKeyConstraintSchema,
})
export type Relationship = v.InferOutput<typeof relationshipSchema>

const tablesSchema = v.record(tableNameSchema, tableSchema)
export type Tables = v.InferOutput<typeof tablesSchema>

const relationshipsSchema = v.record(relationshipNameSchema, relationshipSchema)
export type Relationships = v.InferOutput<typeof relationshipsSchema>

export const dbStructureSchema = v.object({
  tables: tablesSchema,
  relationships: relationshipsSchema,
})

export type DBStructure = v.InferOutput<typeof dbStructureSchema>
