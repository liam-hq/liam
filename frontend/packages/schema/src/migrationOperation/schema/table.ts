import * as v from 'valibot'
import { tableSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { MigrationOperation } from './index.js'

const tablePathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.TABLE_BASE))
const tableNamePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.TABLE_NAME),
)
const tableCommentPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.TABLE_COMMENT),
)

const addTableMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: tablePathSchema,
    value: tableSchema,
  }),
  v.description('Add new table with complete definition'),
)

const removeTableMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: tablePathSchema,
  }),
  v.description('Remove existing table'),
)

const replaceTableNameMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: tableNamePathSchema,
    value: v.string(),
  }),
  v.description('Rename existing table'),
)

const replaceTableCommentMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: tableCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace table comment'),
)

export type AddTableMigrationOperation = v.InferOutput<
  typeof addTableMigrationOperationSchema
>
export type RemoveTableMigrationOperation = v.InferOutput<
  typeof removeTableMigrationOperationSchema
>
export type ReplaceTableNameMigrationOperation = v.InferOutput<
  typeof replaceTableNameMigrationOperationSchema
>
export type ReplaceTableCommentMigrationOperation = v.InferOutput<
  typeof replaceTableCommentMigrationOperationSchema
>

export const isAddTableMigrationOperation = (
  operation: MigrationOperation,
): operation is AddTableMigrationOperation => {
  return v.safeParse(addTableMigrationOperationSchema, operation).success
}

export const isRemoveTableMigrationOperation = (
  operation: MigrationOperation,
): operation is RemoveTableMigrationOperation => {
  return v.safeParse(removeTableMigrationOperationSchema, operation).success
}

export const isReplaceTableNameMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceTableNameMigrationOperation => {
  return v.safeParse(replaceTableNameMigrationOperationSchema, operation)
    .success
}

export const isReplaceTableCommentMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceTableCommentMigrationOperation => {
  return v.safeParse(replaceTableCommentMigrationOperationSchema, operation)
    .success
}

export const tableMigrationOperations = [
  addTableMigrationOperationSchema,
  removeTableMigrationOperationSchema,
  replaceTableNameMigrationOperationSchema,
  replaceTableCommentMigrationOperationSchema,
]
