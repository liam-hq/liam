import * as v from 'valibot'
import { columnOperations } from './column.js'
import { constraintOperations } from './constraint.js'
import { enumOperations } from './enum.js'
import { indexOperations } from './indexOperations.js'
import { tableOperations } from './table.js'

export const operationSchema = v.union([
  ...tableOperations,
  ...columnOperations,
  ...indexOperations,
  ...constraintOperations,
  ...enumOperations,
])
export type Operation = v.InferOutput<typeof operationSchema>

export const operationsSchema = v.pipe(
  v.array(operationSchema),
  v.description('JSON Patch operations for database schema modifications'),
)

const changeStatusSchema = v.picklist([
  'added',
  'removed',
  'modified',
  'unchanged',
])
export type ChangeStatus = v.InferOutput<typeof changeStatusSchema>
