import * as v from 'valibot'

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
  addOperationSchema,
  removeOperationSchema,
  replaceOperationSchema,
  moveOperationSchema,
  copyOperationSchema,
  testOperationSchema,
])

export const operationsSchema = v.array(operationSchema)
