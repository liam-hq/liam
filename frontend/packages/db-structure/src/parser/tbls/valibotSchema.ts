import { array, boolean, nullable, object, optional, string } from 'valibot'

const ColumnSchema = object({
  name: string(),
  type: string(),
  nullable: boolean(),
  default: optional(nullable(string())),
  comment: optional(nullable(string())),
})

const ConstraintSchema = object({
  type: string(),
  name: string(),
  columns: optional(array(string())),
  def: string(),
  referenced_table: optional(string()),
  referenced_columns: optional(array(string())),
})

const IndexSchema = object({
  name: string(),
  def: string(),
  columns: array(string()),
})

const CompatibleTableSchema = object({
  name: string(),
  columns: array(ColumnSchema),
  constraints: optional(array(ConstraintSchema)),
  indexes: optional(array(IndexSchema)),
  comment: optional(nullable(string())),
})

export const TablesSchema = object({
  tables: array(CompatibleTableSchema),
})
