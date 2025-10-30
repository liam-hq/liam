import * as v from 'valibot'
import { enumNameSchema, enumSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { MigrationOperation } from './index.js'

const enumPathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.ENUM_BASE))
const enumNamePathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.ENUM_NAME))
const enumValuesPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.ENUM_VALUES),
)
const enumCommentPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.ENUM_COMMENT),
)

const addEnumMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: enumPathSchema,
    value: enumSchema,
  }),
  v.description('Add new enum with complete definition'),
)

const removeEnumMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: enumPathSchema,
  }),
  v.description('Remove existing enum'),
)

const replaceEnumNameMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumNamePathSchema,
    value: v.pipe(enumNameSchema, v.minLength(1)),
  }),
  v.description('Rename existing enum'),
)

const replaceEnumValuesMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumValuesPathSchema,
    value: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  v.description('Replace enum values'),
)

const replaceEnumCommentMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace enum comment'),
)

export type AddEnumMigrationOperation = v.InferOutput<
  typeof addEnumMigrationOperationSchema
>
export type RemoveEnumMigrationOperation = v.InferOutput<
  typeof removeEnumMigrationOperationSchema
>
export type ReplaceEnumNameMigrationOperation = v.InferOutput<
  typeof replaceEnumNameMigrationOperationSchema
>
export type ReplaceEnumValuesMigrationOperation = v.InferOutput<
  typeof replaceEnumValuesMigrationOperationSchema
>
export type ReplaceEnumCommentMigrationOperation = v.InferOutput<
  typeof replaceEnumCommentMigrationOperationSchema
>

// Helper for type guards to reduce repetition
const isOperationOf =
  <T extends MigrationOperation>(schema: v.GenericSchema<T>) =>
  (operation: MigrationOperation): operation is T =>
    v.safeParse(schema, operation).success

export const isAddEnumMigrationOperation =
  isOperationOf<AddEnumMigrationOperation>(addEnumMigrationOperationSchema)

export const isRemoveEnumMigrationOperation =
  isOperationOf<RemoveEnumMigrationOperation>(
    removeEnumMigrationOperationSchema,
  )

export const isReplaceEnumNameMigrationOperation =
  isOperationOf<ReplaceEnumNameMigrationOperation>(
    replaceEnumNameMigrationOperationSchema,
  )

export const isReplaceEnumValuesMigrationOperation =
  isOperationOf<ReplaceEnumValuesMigrationOperation>(
    replaceEnumValuesMigrationOperationSchema,
  )

export const isReplaceEnumCommentMigrationOperation =
  isOperationOf<ReplaceEnumCommentMigrationOperation>(
    replaceEnumCommentMigrationOperationSchema,
  )

// Export individual schemas
export {
  addEnumMigrationOperationSchema,
  removeEnumMigrationOperationSchema,
  replaceEnumNameMigrationOperationSchema,
  replaceEnumValuesMigrationOperationSchema,
  replaceEnumCommentMigrationOperationSchema,
}

export const enumMigrationOperations = [
  addEnumMigrationOperationSchema,
  removeEnumMigrationOperationSchema,
  replaceEnumNameMigrationOperationSchema,
  replaceEnumValuesMigrationOperationSchema,
  replaceEnumCommentMigrationOperationSchema,
]
