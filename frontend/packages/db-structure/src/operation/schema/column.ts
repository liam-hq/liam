import * as v from 'valibot'
import { columnSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

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
const addColumnOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: columnPathSchema,
    value: columnSchema,
  }),
  v.description('Add new column to table'),
)

export type AddColumnOperation = v.InferOutput<typeof addColumnOperationSchema>

export const isAddColumnOperation = (
  operation: Operation,
): operation is AddColumnOperation => {
  return v.safeParse(addColumnOperationSchema, operation).success
}

// Remove column operation
const removeColumnOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: columnPathSchema,
  }),
  v.description('Remove existing column'),
)

export type RemoveColumnOperation = v.InferOutput<
  typeof removeColumnOperationSchema
>

export const isRemoveColumnOperation = (
  operation: Operation,
): operation is RemoveColumnOperation => {
  return v.safeParse(removeColumnOperationSchema, operation).success
}

// Rename column operation (replace operation for column name)
const renameColumnOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnNamePathSchema,
    value: v.string(),
  }),
  v.description('Rename existing column'),
)

// Replace column type operation
const replaceColumnTypeOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnTypePathSchema,
    value: v.string(),
  }),
  v.description('Replace column type'),
)

// Replace column comment operation
const replaceColumnCommentOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace column comment'),
)

// Replace column check constraint operation
const replaceColumnCheckOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnCheckPathSchema,
    value: v.string(),
  }),
  v.description('Replace column check constraint'),
)

// Replace column notNull operation
const replaceColumnNotNullOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnNotNullPathSchema,
    value: v.boolean(),
  }),
  v.description('Replace column notNull constraint'),
)

// Replace column default operation
const replaceColumnDefaultOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: columnDefaultPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace column default value'),
)

export type RenameColumnOperation = v.InferOutput<
  typeof renameColumnOperationSchema
>
export type ReplaceColumnTypeOperation = v.InferOutput<
  typeof replaceColumnTypeOperationSchema
>
export type ReplaceColumnCommentOperation = v.InferOutput<
  typeof replaceColumnCommentOperationSchema
>
export type ReplaceColumnCheckOperation = v.InferOutput<
  typeof replaceColumnCheckOperationSchema
>
export type ReplaceColumnNotNullOperation = v.InferOutput<
  typeof replaceColumnNotNullOperationSchema
>
export type ReplaceColumnDefaultOperation = v.InferOutput<
  typeof replaceColumnDefaultOperationSchema
>

export const isRenameColumnOperation = (
  operation: Operation,
): operation is RenameColumnOperation => {
  return v.safeParse(renameColumnOperationSchema, operation).success
}

export const isReplaceColumnTypeOperation = (
  operation: Operation,
): operation is ReplaceColumnTypeOperation => {
  return v.safeParse(replaceColumnTypeOperationSchema, operation).success
}

export const isReplaceColumnCommentOperation = (
  operation: Operation,
): operation is ReplaceColumnCommentOperation => {
  return v.safeParse(replaceColumnCommentOperationSchema, operation).success
}

export const isReplaceColumnCheckOperation = (
  operation: Operation,
): operation is ReplaceColumnCheckOperation => {
  return v.safeParse(replaceColumnCheckOperationSchema, operation).success
}

export const isReplaceColumnNotNullOperation = (
  operation: Operation,
): operation is ReplaceColumnNotNullOperation => {
  return v.safeParse(replaceColumnNotNullOperationSchema, operation).success
}

export const isReplaceColumnDefaultOperation = (
  operation: Operation,
): operation is ReplaceColumnDefaultOperation => {
  return v.safeParse(replaceColumnDefaultOperationSchema, operation).success
}

// Export all column operations
export const columnOperations = [
  addColumnOperationSchema,
  removeColumnOperationSchema,
  renameColumnOperationSchema,
  replaceColumnTypeOperationSchema,
  replaceColumnCommentOperationSchema,
  replaceColumnCheckOperationSchema,
  replaceColumnNotNullOperationSchema,
  replaceColumnDefaultOperationSchema,
]
