import * as v from 'valibot'
import { columnMigrationOperations } from './column.js'
import { constraintMigrationOperations } from './constraint.js'
import { enumMigrationOperations } from './enum.js'
import { extensionMigrationOperations } from './extension.js'
import { indexMigrationOperations } from './indexMigrationOperations.js'
import { tableMigrationOperations } from './table.js'

export const migrationOperationSchema = v.union([
  ...tableMigrationOperations,
  ...columnMigrationOperations,
  ...indexMigrationOperations,
  ...constraintMigrationOperations,
  ...enumMigrationOperations,
  ...extensionMigrationOperations,
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
