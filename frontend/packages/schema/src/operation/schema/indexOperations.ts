import * as v from 'valibot'
import { indexSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const indexPathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.INDEX_BASE))
const indexUniquePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.INDEX_UNIQUE),
)
const indexColumnsPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.INDEX_COLUMNS),
)
const indexColumnsElementPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.INDEX_COLUMNS_ELEMENT),
)
const indexTypePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.INDEX_TYPE),
)

// Add index operation
const addIndexOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: indexPathSchema,
    value: indexSchema,
  }),
  v.description('Add new index to table'),
)

export type AddIndexOperation = v.InferOutput<typeof addIndexOperationSchema>

export const isAddIndexOperation = (
  operation: Operation,
): operation is AddIndexOperation => {
  return v.safeParse(addIndexOperationSchema, operation).success
}

// Remove index operation
const removeIndexOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: indexPathSchema,
  }),
  v.description('Remove existing index'),
)

export type RemoveIndexOperation = v.InferOutput<
  typeof removeIndexOperationSchema
>

export const isRemoveIndexOperation = (
  operation: Operation,
): operation is RemoveIndexOperation => {
  return v.safeParse(removeIndexOperationSchema, operation).success
}

// Replace index unique operation
const replaceIndexUniqueOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexUniquePathSchema,
    value: v.boolean(),
  }),
  v.description('Replace index unique property'),
)

// Replace index columns operation
const replaceIndexColumnsOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexColumnsPathSchema,
    value: v.array(v.string()),
  }),
  v.description('Replace index columns'),
)

// Replace index type operation
const replaceIndexTypeOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexTypePathSchema,
    value: v.string(),
  }),
  v.description('Replace index type'),
)

// Add index column element operation
const addIndexColumnElementOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: indexColumnsElementPathSchema,
    value: v.string(),
  }),
  v.description('Add column to index columns array'),
)

// Remove index column element operation
const removeIndexColumnElementOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: indexColumnsElementPathSchema,
  }),
  v.description('Remove column from index columns array'),
)

// Replace index column element operation
const replaceIndexColumnElementOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexColumnsElementPathSchema,
    value: v.string(),
  }),
  v.description('Replace column in index columns array'),
)

// Export all index operations
export const indexOperations = [
  addIndexOperationSchema,
  removeIndexOperationSchema,
  replaceIndexUniqueOperationSchema,
  replaceIndexColumnsOperationSchema,
  replaceIndexTypeOperationSchema,
  addIndexColumnElementOperationSchema,
  removeIndexColumnElementOperationSchema,
  replaceIndexColumnElementOperationSchema,
]
