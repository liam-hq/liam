import * as v from 'valibot'
import { constraintSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const constraintPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_BASE),
)
const constraintDeletePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_DELETE_CONSTRAINT),
)
const constraintUpdatePathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_UPDATE_CONSTRAINT),
)
const constraintDetailPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_DETAIL),
)

const addConstraintOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: constraintPathSchema,
    value: constraintSchema,
  }),
  v.description('Add new constraint to table'),
)

export type AddConstraintOperation = v.InferOutput<
  typeof addConstraintOperationSchema
>

export const isAddConstraintOperation = (
  operation: Operation,
): operation is AddConstraintOperation => {
  return v.safeParse(addConstraintOperationSchema, operation).success
}

const removeConstraintOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: constraintPathSchema,
  }),
  v.description('Remove existing constraint'),
)

export type RemoveConstraintOperation = v.InferOutput<
  typeof removeConstraintOperationSchema
>

export const isRemoveConstraintOperation = (
  operation: Operation,
): operation is RemoveConstraintOperation => {
  return v.safeParse(removeConstraintOperationSchema, operation).success
}

const replaceConstraintDeleteOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintDeletePathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint delete action'),
)

export type ReplaceConstraintDeleteOperation = v.InferOutput<
  typeof replaceConstraintDeleteOperationSchema
>

export const isReplaceConstraintDeleteOperation = (
  operation: Operation,
): operation is ReplaceConstraintDeleteOperation => {
  return v.safeParse(replaceConstraintDeleteOperationSchema, operation).success
}

const replaceConstraintUpdateOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintUpdatePathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint update action'),
)

export type ReplaceConstraintUpdateOperation = v.InferOutput<
  typeof replaceConstraintUpdateOperationSchema
>

export const isReplaceConstraintUpdateOperation = (
  operation: Operation,
): operation is ReplaceConstraintUpdateOperation => {
  return v.safeParse(replaceConstraintUpdateOperationSchema, operation).success
}

const constraintColumnNamesArrayPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_COLUMN_NAMES_ARRAY),
)

const replaceConstraintColumnNamesArrayOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintColumnNamesArrayPathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint column name in array'),
)

const replaceConstraintDetailOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintDetailPathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint detail'),
)

export const constraintOperations = [
  addConstraintOperationSchema,
  removeConstraintOperationSchema,
  replaceConstraintDeleteOperationSchema,
  replaceConstraintUpdateOperationSchema,
  replaceConstraintColumnNamesArrayOperationSchema,
  replaceConstraintDetailOperationSchema,
]
