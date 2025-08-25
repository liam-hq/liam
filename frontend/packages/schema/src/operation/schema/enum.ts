import * as v from 'valibot'
import { enumNameSchema, enumSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

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

const addEnumOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: enumPathSchema,
    value: enumSchema,
  }),
  v.description('Add new enum with complete definition'),
)

const removeEnumOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: enumPathSchema,
  }),
  v.description('Remove existing enum'),
)

const replaceEnumNameOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumNamePathSchema,
    value: v.pipe(enumNameSchema, v.minLength(1)),
  }),
  v.description('Rename existing enum'),
)

const replaceEnumValuesOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumValuesPathSchema,
    value: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  v.description('Replace enum values'),
)

const replaceEnumCommentOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: enumCommentPathSchema,
    value: v.union([v.string(), v.null()]),
  }),
  v.description('Replace enum comment'),
)

export type AddEnumOperation = v.InferOutput<typeof addEnumOperationSchema>
export type RemoveEnumOperation = v.InferOutput<
  typeof removeEnumOperationSchema
>
export type ReplaceEnumNameOperation = v.InferOutput<
  typeof replaceEnumNameOperationSchema
>
export type ReplaceEnumValuesOperation = v.InferOutput<
  typeof replaceEnumValuesOperationSchema
>
export type ReplaceEnumCommentOperation = v.InferOutput<
  typeof replaceEnumCommentOperationSchema
>

// Helper for type guards to reduce repetition
const isOperationOf =
  <T extends Operation>(schema: v.GenericSchema<T>) =>
  (operation: Operation): operation is T =>
    v.safeParse(schema, operation).success

export const isAddEnumOperation = isOperationOf<AddEnumOperation>(
  addEnumOperationSchema,
)

export const isRemoveEnumOperation = isOperationOf<RemoveEnumOperation>(
  removeEnumOperationSchema,
)

export const isReplaceEnumNameOperation =
  isOperationOf<ReplaceEnumNameOperation>(replaceEnumNameOperationSchema)

export const isReplaceEnumValuesOperation =
  isOperationOf<ReplaceEnumValuesOperation>(replaceEnumValuesOperationSchema)

export const isReplaceEnumCommentOperation =
  isOperationOf<ReplaceEnumCommentOperation>(replaceEnumCommentOperationSchema)

// Export individual schemas
export {
  addEnumOperationSchema,
  removeEnumOperationSchema,
  replaceEnumNameOperationSchema,
  replaceEnumValuesOperationSchema,
  replaceEnumCommentOperationSchema,
}

export const enumOperations = [
  addEnumOperationSchema,
  removeEnumOperationSchema,
  replaceEnumNameOperationSchema,
  replaceEnumValuesOperationSchema,
  replaceEnumCommentOperationSchema,
]
