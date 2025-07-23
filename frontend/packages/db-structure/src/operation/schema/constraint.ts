import * as v from 'valibot'
import { constraintSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const constraintPathSchema = v.pipe(
  v.string(),
  v.regex(PATH_PATTERNS.CONSTRAINT_BASE),
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

export const constraintOperations = [
  addConstraintOperationSchema,
  removeConstraintOperationSchema,
]
