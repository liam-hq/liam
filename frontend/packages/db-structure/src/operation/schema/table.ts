import * as v from 'valibot'
import { tableSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import type { Operation } from './index.js'

const tablePathSchema = v.pipe(v.string(), v.regex(PATH_PATTERNS.TABLE_BASE))

const addTableOperationSchema = v.object({
  op: v.literal('add'),
  path: tablePathSchema,
  value: tableSchema,
})

const removeTableOperationSchema = v.object({
  op: v.literal('remove'),
  path: tablePathSchema,
})

export type AddTableOperation = v.InferOutput<typeof addTableOperationSchema>
export type RemoveTableOperation = v.InferOutput<
  typeof removeTableOperationSchema
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

export const tableOperations = [
  addTableOperationSchema,
  removeTableOperationSchema,
]
