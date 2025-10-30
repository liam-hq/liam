import * as v from 'valibot'
import { indexSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { MigrationOperation } from './index.js'

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
const addIndexMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: indexPathSchema,
    value: indexSchema,
  }),
  v.description('Add new index to table'),
)

export type AddIndexMigrationOperation = v.InferOutput<
  typeof addIndexMigrationOperationSchema
>

export const isAddIndexMigrationOperation = (
  operation: MigrationOperation,
): operation is AddIndexMigrationOperation => {
  return v.safeParse(addIndexMigrationOperationSchema, operation).success
}

// Remove index operation
const removeIndexMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: indexPathSchema,
  }),
  v.description('Remove existing index'),
)

export type RemoveIndexMigrationOperation = v.InferOutput<
  typeof removeIndexMigrationOperationSchema
>

export const isRemoveIndexMigrationOperation = (
  operation: MigrationOperation,
): operation is RemoveIndexMigrationOperation => {
  return v.safeParse(removeIndexMigrationOperationSchema, operation).success
}

// Replace index unique operation
const replaceIndexUniqueMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexUniquePathSchema,
    value: v.boolean(),
  }),
  v.description('Replace index unique property'),
)

// Replace index columns operation
const replaceIndexColumnsMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexColumnsPathSchema,
    value: v.array(v.string()),
  }),
  v.description('Replace index columns'),
)

// Replace index type operation
const replaceIndexTypeMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexTypePathSchema,
    value: v.string(),
  }),
  v.description('Replace index type'),
)

// Add index column element operation
const addIndexColumnElementMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: indexColumnsElementPathSchema,
    value: v.string(),
  }),
  v.description('Add column to index columns array'),
)

// Remove index column element operation
const removeIndexColumnElementMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: indexColumnsElementPathSchema,
  }),
  v.description('Remove column from index columns array'),
)

// Replace index column element operation
const replaceIndexColumnElementMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: indexColumnsElementPathSchema,
    value: v.string(),
  }),
  v.description('Replace column in index columns array'),
)

// Export all index operations
export const indexMigrationOperations = [
  addIndexMigrationOperationSchema,
  removeIndexMigrationOperationSchema,
  replaceIndexUniqueMigrationOperationSchema,
  replaceIndexColumnsMigrationOperationSchema,
  replaceIndexTypeMigrationOperationSchema,
  addIndexColumnElementMigrationOperationSchema,
  removeIndexColumnElementMigrationOperationSchema,
  replaceIndexColumnElementMigrationOperationSchema,
]
