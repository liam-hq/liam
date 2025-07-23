import * as v from 'valibot'
import { columnOperations } from './column.js'
import { constraintOperations } from './constraint.js'
import { indexOperations } from './indexOperations.js'
import { tableOperations } from './table.js'

const operationSchema = v.union([
  ...tableOperations,
  ...columnOperations,
  ...indexOperations,
  ...constraintOperations,
])
export type Operation = v.InferOutput<typeof operationSchema>

export const operationsSchema = v.pipe(
  v.array(operationSchema),
  v.description('JSON Patch operations for database schema modifications'),
)
