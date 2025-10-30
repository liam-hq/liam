import * as v from 'valibot'
import { columnSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'

import type { MigrationOperation } from './index.js'

const columnPathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.COLUMN_BASE))
const columnNamePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_NAME),
)
const columnTypePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_TYPE),
)
const columnCommentPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_COMMENT),
)
const columnCheckPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_CHECK),
)
const columnNotNullPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_NOT_NULL),
)
const columnDefaultPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.COLUMN_DEFAULT),
)

// Add column operation
const addColumnMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: columnPathSchema,
    value: columnSchema,
  }),
  v.description('Add new column to table'),
)

export type AddColumnMigrationOperation = v.InferOutput<
  typeof addColumnMigrationOperationSchema
>

export const isAddColumnMigrationOperation = (
  operation: MigrationOperation,
): operation is AddColumnMigrationOperation => {
  return v.safeParse(addColumnMigrationOperationSchema, operation).success
}

// Remove column operation
const removeColumnMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: columnPathSchema,
  }),
  v.description('Remove existing column'),
)

export type RemoveColumnMigrationOperation = v.InferOutput<
  typeof removeColumnMigrationOperationSchema
>

export const isRemoveColumnMigrationOperation = (
  operation: MigrationOperation,
): operation is RemoveColumnMigrationOperation => {
  return v.safeParse(removeColumnMigrationOperationSchema, operation).success
}

// Rename column operation (replace operation for column name)
const renameColumnMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnNamePathSchema,
    value: v.string(),
  }),
  v.description('Rename existing column'),
)

// Replace column type operation
const replaceColumnTypeMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnTypePathSchema,
    value: v.string(),
  }),
  v.description('Replace column type'),
)

// Replace column comment operation
const replaceColumnCommentMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace column comment'),
)

// Replace column check constraint operation
const replaceColumnCheckMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnCheckPathSchema,
    value: v.string(),
  }),
  v.description('Replace column check constraint'),
)

// Replace column notNull operation
const replaceColumnNotNullMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnNotNullPathSchema,
    value: v.boolean(),
  }),
  v.description('Replace column notNull constraint'),
)

// Replace column default operation
const replaceColumnDefaultMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnDefaultPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace column default value'),
)

export type RenameColumnMigrationOperation = v.InferOutput<
  typeof renameColumnMigrationOperationSchema
>
export type ReplaceColumnTypeMigrationOperation = v.InferOutput<
  typeof replaceColumnTypeMigrationOperationSchema
>
export type ReplaceColumnCommentMigrationOperation = v.InferOutput<
  typeof replaceColumnCommentMigrationOperationSchema
>
export type ReplaceColumnCheckMigrationOperation = v.InferOutput<
  typeof replaceColumnCheckMigrationOperationSchema
>
export type ReplaceColumnNotNullMigrationOperation = v.InferOutput<
  typeof replaceColumnNotNullMigrationOperationSchema
>
export type ReplaceColumnDefaultMigrationOperation = v.InferOutput<
  typeof replaceColumnDefaultMigrationOperationSchema
>

export const isRenameColumnMigrationOperation = (
  operation: MigrationOperation,
): operation is RenameColumnMigrationOperation => {
  return v.safeParse(renameColumnMigrationOperationSchema, operation).success
}

export const isReplaceColumnTypeMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceColumnTypeMigrationOperation => {
  return v.safeParse(replaceColumnTypeMigrationOperationSchema, operation)
    .success
}

export const isReplaceColumnCommentMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceColumnCommentMigrationOperation => {
  return v.safeParse(replaceColumnCommentMigrationOperationSchema, operation)
    .success
}

export const isReplaceColumnCheckMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceColumnCheckMigrationOperation => {
  return v.safeParse(replaceColumnCheckMigrationOperationSchema, operation)
    .success
}

export const isReplaceColumnNotNullMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceColumnNotNullMigrationOperation => {
  return v.safeParse(replaceColumnNotNullMigrationOperationSchema, operation)
    .success
}

export const isReplaceColumnDefaultMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceColumnDefaultMigrationOperation => {
  return v.safeParse(replaceColumnDefaultMigrationOperationSchema, operation)
    .success
}

// Export all column operations
export const columnMigrationOperations = [
  addColumnMigrationOperationSchema,
  removeColumnMigrationOperationSchema,
  renameColumnMigrationOperationSchema,
  replaceColumnTypeMigrationOperationSchema,
  replaceColumnCommentMigrationOperationSchema,
  replaceColumnCheckMigrationOperationSchema,
  replaceColumnNotNullMigrationOperationSchema,
  replaceColumnDefaultMigrationOperationSchema,
]
