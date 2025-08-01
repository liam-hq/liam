import * as v from 'valibot'
import { tableSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const tablePathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.TABLE_BASE))
const tableNamePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.TABLE_NAME),
)
const tableCommentPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.TABLE_COMMENT),
)

const addTableOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: tablePathSchema,
    value: tableSchema,
  }),
  v.description('Add new table with complete definition'),
)

const removeTableOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: tablePathSchema,
  }),
  v.description('Remove existing table'),
)

const replaceTableNameOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: tableNamePathSchema,
    value: v.string(),
  }),
  v.description('Rename existing table'),
)

const replaceTableCommentOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: tableCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace table comment'),
)

export type AddTableOperation = v.InferOutput<typeof addTableOperationSchema>
export type RemoveTableOperation = v.InferOutput<
  typeof removeTableOperationSchema
>
export type ReplaceTableNameOperation = v.InferOutput<
  typeof replaceTableNameOperationSchema
>
export type ReplaceTableCommentOperation = v.InferOutput<
  typeof replaceTableCommentOperationSchema
>

export const isAddTableOperation = (
  operation: Operation,
): operation is AddTableOperation => {
  return v.safeParse(addTableOperationSchema, operation).success
}

export const isRemoveTableOperation = (
  operation: Operation,
): operation is RemoveTableOperation => {
  return v.safeParse(removeTableOperationSchema, operation).success
}

export const isReplaceTableNameOperation = (
  operation: Operation,
): operation is ReplaceTableNameOperation => {
  return v.safeParse(replaceTableNameOperationSchema, operation).success
}

export const isReplaceTableCommentOperation = (
  operation: Operation,
): operation is ReplaceTableCommentOperation => {
  return v.safeParse(replaceTableCommentOperationSchema, operation).success
}

export const tableOperations = [
  addTableOperationSchema,
  removeTableOperationSchema,
  replaceTableNameOperationSchema,
  replaceTableCommentOperationSchema,
]
