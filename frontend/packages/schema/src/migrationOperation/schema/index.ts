import * as v from 'valibot'
import { columnOperations } from './column.js'
import { constraintOperations } from './constraint.js'
import { enumOperations } from './enum.js'
import { extensionOperations } from './extension.js'
import { indexOperations } from './indexOperations.js'
import { tableOperations } from './table.js'

export const migrationOperationSchema = v.union([
  ...tableOperations,
  ...columnOperations,
  ...indexOperations,
  ...constraintOperations,
  ...enumOperations,
  ...extensionOperations,
])
export type MigrationOperation = v.InferOutput<typeof migrationOperationSchema>

export const migrationOperationsSchema = v.pipe(
  v.array(migrationOperationSchema),
  v.description('JSON Patch operations for database schema modifications'),
)

const changeStatusSchema = v.picklist([
  'added',
  'removed',
  'modified',
  'unchanged',
])
export type ChangeStatus = v.InferOutput<typeof changeStatusSchema>
