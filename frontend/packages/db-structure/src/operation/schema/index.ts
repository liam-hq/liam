import * as v from 'valibot'
import { columnOperations } from './column.js'
import { constraintOperations } from './constraint.js'
import { indexOperations } from './indexOperations.js'
import { tableOperations } from './table.js'

const addOperationSchema = v.object({
  op: v.literal('add'),
  path: v.string(),
  value: v.any(),
})

const removeOperationSchema = v.object({
  op: v.literal('remove'),
  path: v.string(),
})

const replaceOperationSchema = v.object({
  op: v.literal('replace'),
  path: v.string(),
  value: v.any(),
})

const moveOperationSchema = v.object({
  op: v.literal('move'),
  from: v.string(),
  path: v.string(),
})

const copyOperationSchema = v.object({
  op: v.literal('copy'),
  from: v.string(),
  path: v.string(),
})

const testOperationSchema = v.object({
  op: v.literal('test'),
  path: v.string(),
  value: v.any(),
})

const operationSchema = v.union([
  ...tableOperations,
  ...columnOperations,
  ...indexOperations,
  ...constraintOperations,
  addOperationSchema,
  removeOperationSchema,
  replaceOperationSchema,
  moveOperationSchema,
  copyOperationSchema,
  testOperationSchema,
])
export type Operation = v.InferOutput<typeof operationSchema>

export const operationsSchema = v.array(operationSchema)
