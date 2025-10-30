import * as v from 'valibot'
import { constraintSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { MigrationOperation } from './index.js'

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

const addConstraintMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('add'),
    path: constraintPathSchema,
    value: constraintSchema,
  }),
  v.description('Add new constraint to table'),
)

export type AddConstraintMigrationOperation = v.InferOutput<
  typeof addConstraintMigrationOperationSchema
>

export const isAddConstraintMigrationOperation = (
  operation: MigrationOperation,
): operation is AddConstraintMigrationOperation => {
  return v.safeParse(addConstraintMigrationOperationSchema, operation).success
}

const removeConstraintMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('remove'),
    path: constraintPathSchema,
  }),
  v.description('Remove existing constraint'),
)

export type RemoveConstraintMigrationOperation = v.InferOutput<
  typeof removeConstraintMigrationOperationSchema
>

export const isRemoveConstraintMigrationOperation = (
  operation: MigrationOperation,
): operation is RemoveConstraintMigrationOperation => {
  return v.safeParse(removeConstraintMigrationOperationSchema, operation)
    .success
}

const replaceConstraintDeleteMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintDeletePathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint delete action'),
)

export type ReplaceConstraintDeleteMigrationOperation = v.InferOutput<
  typeof replaceConstraintDeleteMigrationOperationSchema
>

export const isReplaceConstraintDeleteMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceConstraintDeleteMigrationOperation => {
  return v.safeParse(replaceConstraintDeleteMigrationOperationSchema, operation)
    .success
}

const replaceConstraintUpdateMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintUpdatePathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint update action'),
)

export type ReplaceConstraintUpdateMigrationOperation = v.InferOutput<
  typeof replaceConstraintUpdateMigrationOperationSchema
>

export const isReplaceConstraintUpdateMigrationOperation = (
  operation: MigrationOperation,
): operation is ReplaceConstraintUpdateMigrationOperation => {
  return v.safeParse(replaceConstraintUpdateMigrationOperationSchema, operation)
    .success
}

const constraintColumnNamesArrayPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_COLUMN_NAMES_ARRAY),
)

const replaceConstraintColumnNamesArrayMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintColumnNamesArrayPathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint column name in array'),
)

const replaceConstraintDetailMigrationOperationSchema = v.pipe(
  v.object({
    op: v.literal('replace'),
    path: constraintDetailPathSchema,
    value: v.string(),
  }),
  v.description('Replace constraint detail'),
)

export const constraintMigrationOperations = [
  addConstraintMigrationOperationSchema,
  removeConstraintMigrationOperationSchema,
  replaceConstraintDeleteMigrationOperationSchema,
  replaceConstraintUpdateMigrationOperationSchema,
  replaceConstraintColumnNamesArrayMigrationOperationSchema,
  replaceConstraintDetailMigrationOperationSchema,
]
