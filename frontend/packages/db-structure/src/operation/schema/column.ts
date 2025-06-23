import * as v from 'valibot'
import { columnSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const columnPathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.COLUMN_BASE))

// Add column operation
const addColumnOperationSchema = v.object({
  op: v.literal('add'),
  path: columnPathSchema,
  value: columnSchema,
})

export type AddColumnOperation = v.InferOutput<typeof addColumnOperationSchema>

export const isAddColumnOperation = (
  operation: Operation,
): operation is AddColumnOperation => {
  return v.safeParse(addColumnOperationSchema, operation).success
}

// Remove column operation
const removeColumnOperationSchema = v.object({
  op: v.literal('remove'),
  path: columnPathSchema,
})

export type RemoveColumnOperation = v.InferOutput<
  typeof removeColumnOperationSchema
>

export const isRemoveColumnOperation = (
  operation: Operation,
): operation is RemoveColumnOperation => {
  return v.safeParse(removeColumnOperationSchema, operation).success
}

// Export all column operations
export const columnOperations = [
  addColumnOperationSchema,
  removeColumnOperationSchema,
]
