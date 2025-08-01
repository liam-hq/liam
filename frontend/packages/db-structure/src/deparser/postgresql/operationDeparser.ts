import { err, ok, type Result } from 'neverthrow'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type {
  AddColumnOperation,
  RemoveColumnOperation,
  RenameColumnOperation,
  ReplaceColumnCheckOperation,
  ReplaceColumnCommentOperation,
  ReplaceColumnDefaultOperation,
  ReplaceColumnNotNullOperation,
  ReplaceColumnTypeOperation,
} from '../../operation/schema/column.js'
import {
  isAddColumnOperation,
  isRemoveColumnOperation,
  isRenameColumnOperation,
  isReplaceColumnCheckOperation,
  isReplaceColumnCommentOperation,
  isReplaceColumnDefaultOperation,
  isReplaceColumnNotNullOperation,
  isReplaceColumnTypeOperation,
} from '../../operation/schema/column.js'
import type {
  AddConstraintOperation,
  RemoveConstraintOperation,
  ReplaceConstraintDeleteOperation,
  ReplaceConstraintUpdateOperation,
} from '../../operation/schema/constraint.js'
import {
  isAddConstraintOperation,
  isRemoveConstraintOperation,
  isReplaceConstraintDeleteOperation,
  isReplaceConstraintUpdateOperation,
} from '../../operation/schema/constraint.js'
import type { Operation } from '../../operation/schema/index.js'
import type {
  AddIndexOperation,
  RemoveIndexOperation,
} from '../../operation/schema/indexOperations.js'
import {
  isAddIndexOperation,
  isRemoveIndexOperation,
} from '../../operation/schema/indexOperations.js'
import type {
  AddTableOperation,
  RemoveTableOperation,
  ReplaceTableCommentOperation,
  ReplaceTableNameOperation,
} from '../../operation/schema/table.js'
import {
  isAddTableOperation,
  isRemoveTableOperation,
  isReplaceTableCommentOperation,
  isReplaceTableNameOperation,
} from '../../operation/schema/table.js'
import type { OperationDeparser } from '../type.js'
import {
  generateAddCheckConstraintStatement,
  generateAddColumnStatement,
  generateAddConstraintStatement,
  generateAlterColumnDefaultStatement,
  generateAlterColumnNotNullStatement,
  generateAlterColumnTypeStatement,
  generateColumnCommentStatement,
  generateCreateIndexStatement,
  generateCreateTableStatement,
  generateDropCheckConstraintStatement,
  generateRemoveColumnStatement,
  generateRemoveConstraintStatement,
  generateRemoveIndexStatement,
  generateRemoveTableStatement,
  generateRenameColumnStatement,
  generateRenameTableStatement,
  generateTableCommentStatement,
} from './utils.js'

/**
 * Extract table name from operation path
 */
function extractTableNameFromPath(path: string): string | null {
  const match = path.match(PATH_PATTERNS.TABLE_BASE)
  return match?.[1] || null
}

/**
 * Extract table name from table name operation path
 */
function extractTableNameFromNamePath(path: string): string | null {
  const match = path.match(PATH_PATTERNS.TABLE_NAME)
  return match?.[1] || null
}

/**
 * Extract table name and column name from column operation path
 */
function extractTableAndColumnNameFromPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_BASE)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table name and column name from column name operation path
 */
function extractTableAndColumnNameFromNamePath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_NAME)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table name and index name from index operation path
 */
function extractTableAndIndexNameFromPath(
  path: string,
): { tableName: string; indexName: string } | null {
  const match = path.match(PATH_PATTERNS.INDEX_BASE)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    indexName: match[2],
  }
}

/**
 * Extract table name and constraint name from constraint operation path
 */
function extractTableAndConstraintNameFromPath(
  path: string,
): { tableName: string; constraintName: string } | null {
  const match = path.match(PATH_PATTERNS.CONSTRAINT_BASE)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    constraintName: match[2],
  }
}

/**
 * Extract table name from table comment path
 */
function extractTableNameFromCommentPath(path: string): string | null {
  const match = path.match(PATH_PATTERNS.TABLE_COMMENT)
  return match?.[1] || null
}

/**
 * Extract table and column names from column type path
 */
function extractTableAndColumnNameFromTypePath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_TYPE)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table and column names from column comment path
 */
function extractTableAndColumnNameFromCommentPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_COMMENT)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table and column names from column check path
 */
function extractTableAndColumnNameFromCheckPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_CHECK)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table and column names from column notNull path
 */
function extractTableAndColumnNameFromNotNullPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_NOT_NULL)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table and column names from column default path
 */
function extractTableAndColumnNameFromDefaultPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(PATH_PATTERNS.COLUMN_DEFAULT)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    columnName: match[2],
  }
}

/**
 * Extract table and constraint names from constraint delete path
 */
function extractTableAndConstraintNameFromDeletePath(
  path: string,
): { tableName: string; constraintName: string } | null {
  const match = path.match(PATH_PATTERNS.CONSTRAINT_DELETE_CONSTRAINT)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    constraintName: match[2],
  }
}

/**
 * Extract table and constraint names from constraint update path
 */
function extractTableAndConstraintNameFromUpdatePath(
  path: string,
): { tableName: string; constraintName: string } | null {
  const match = path.match(PATH_PATTERNS.CONSTRAINT_UPDATE_CONSTRAINT)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    constraintName: match[2],
  }
}

/**
 * Generate CREATE TABLE DDL from table creation operation
 */
function generateCreateTableFromOperation(
  operation: AddTableOperation,
): Result<string, Error> {
  const tableName = extractTableNameFromPath(operation.path)
  if (!tableName) {
    return err(new Error(`Invalid table path: ${operation.path}`))
  }

  const table = operation.value
  const ddlStatements: string[] = []

  // 1. Generate CREATE TABLE statement (includes comments)
  ddlStatements.push(generateCreateTableStatement(table))

  // 2. Generate ADD CONSTRAINT statements
  for (const constraint of Object.values(table.constraints)) {
    ddlStatements.push(generateAddConstraintStatement(table.name, constraint))
  }

  return ok(ddlStatements.join('\n\n'))
}

/**
 * Generate ADD COLUMN DDL from column creation operation
 */
function generateAddColumnFromOperation(
  operation: AddColumnOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column path: ${operation.path}`))
  }

  return ok(generateAddColumnStatement(pathInfo.tableName, operation.value))
}

/**
 * Generate DROP COLUMN DDL from column removal operation
 */
function generateRemoveColumnFromOperation(
  operation: RemoveColumnOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column path: ${operation.path}`))
  }

  return ok(
    generateRemoveColumnStatement(pathInfo.tableName, pathInfo.columnName),
  )
}

/**
 * Generate RENAME COLUMN DDL from column rename operation
 */
function generateRenameColumnFromOperation(
  operation: RenameColumnOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromNamePath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column name path: ${operation.path}`))
  }

  return ok(
    generateRenameColumnStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate DROP TABLE DDL from table removal operation
 */
function generateRemoveTableFromOperation(
  operation: RemoveTableOperation,
): Result<string, Error> {
  const tableName = extractTableNameFromPath(operation.path)
  if (!tableName) {
    return err(new Error(`Invalid table path: ${operation.path}`))
  }

  return ok(generateRemoveTableStatement(tableName))
}

/**
 * Generate RENAME TABLE DDL from table rename operation
 */
function generateRenameTableFromOperation(
  operation: ReplaceTableNameOperation,
): Result<string, Error> {
  const tableName = extractTableNameFromNamePath(operation.path)
  if (!tableName) {
    return err(new Error(`Invalid table name path: ${operation.path}`))
  }

  return ok(generateRenameTableStatement(tableName, operation.value))
}

/**
 * Generate CREATE INDEX DDL from index creation operation
 */
function generateCreateIndexFromOperation(
  operation: AddIndexOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndIndexNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid index path: ${operation.path}`))
  }

  return ok(generateCreateIndexStatement(pathInfo.tableName, operation.value))
}

/**
 * Generate DROP INDEX DDL from index removal operation
 */
function generateRemoveIndexFromOperation(
  operation: RemoveIndexOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndIndexNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid index path: ${operation.path}`))
  }

  return ok(generateRemoveIndexStatement(pathInfo.indexName))
}

/**
 * Generate ADD CONSTRAINT DDL from constraint creation operation
 */
function generateAddConstraintFromOperation(
  operation: AddConstraintOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndConstraintNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid constraint path: ${operation.path}`))
  }

  return ok(generateAddConstraintStatement(pathInfo.tableName, operation.value))
}

/**
 * Generate DROP CONSTRAINT DDL from constraint removal operation
 */
function generateRemoveConstraintFromOperation(
  operation: RemoveConstraintOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndConstraintNameFromPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid constraint path: ${operation.path}`))
  }

  return ok(
    generateRemoveConstraintStatement(
      pathInfo.tableName,
      pathInfo.constraintName,
    ),
  )
}

/**
 * Generate ALTER COLUMN TYPE DDL from column type replacement operation
 */
function generateAlterColumnTypeFromOperation(
  operation: ReplaceColumnTypeOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromTypePath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column type path: ${operation.path}`))
  }

  return ok(
    generateAlterColumnTypeStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate ALTER COLUMN SET/DROP NOT NULL DDL from notNull replacement operation
 */
function generateAlterColumnNotNullFromOperation(
  operation: ReplaceColumnNotNullOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromNotNullPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column notNull path: ${operation.path}`))
  }

  return ok(
    generateAlterColumnNotNullStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate ALTER COLUMN SET/DROP DEFAULT DDL from default replacement operation
 */
function generateAlterColumnDefaultFromOperation(
  operation: ReplaceColumnDefaultOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromDefaultPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column default path: ${operation.path}`))
  }

  return ok(
    generateAlterColumnDefaultStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate COMMENT ON TABLE DDL from table comment replacement operation
 */
function generateTableCommentFromOperation(
  operation: ReplaceTableCommentOperation,
): Result<string, Error> {
  const tableName = extractTableNameFromCommentPath(operation.path)
  if (!tableName) {
    return err(new Error(`Invalid table comment path: ${operation.path}`))
  }

  return ok(generateTableCommentStatement(tableName, operation.value))
}

/**
 * Generate COMMENT ON COLUMN DDL from column comment replacement operation
 */
function generateColumnCommentFromOperation(
  operation: ReplaceColumnCommentOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromCommentPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column comment path: ${operation.path}`))
  }

  return ok(
    generateColumnCommentStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate ADD/DROP CHECK CONSTRAINT DDL from column check replacement operation
 */
function generateAlterColumnCheckFromOperation(
  operation: ReplaceColumnCheckOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndColumnNameFromCheckPath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid column check path: ${operation.path}`))
  }

  // If value is empty or null, drop the check constraint
  if (!operation.value || operation.value.trim() === '') {
    return ok(
      generateDropCheckConstraintStatement(
        pathInfo.tableName,
        pathInfo.columnName,
      ),
    )
  }

  // Otherwise, add a new check constraint
  return ok(
    generateAddCheckConstraintStatement(
      pathInfo.tableName,
      pathInfo.columnName,
      operation.value,
    ),
  )
}

/**
 * Generate ALTER CONSTRAINT DDL for constraint delete action replacement
 * Note: This is not directly supported in PostgreSQL, would require DROP and re-ADD
 */
function generateAlterConstraintDeleteFromOperation(
  operation: ReplaceConstraintDeleteOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndConstraintNameFromDeletePath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid constraint delete path: ${operation.path}`))
  }

  // PostgreSQL doesn't support ALTER CONSTRAINT for changing actions
  // This would require DROP CONSTRAINT and ADD CONSTRAINT with new action
  return err(
    new Error(
      'Altering constraint delete action is not directly supported. Drop and recreate the constraint.',
    ),
  )
}

/**
 * Generate ALTER CONSTRAINT DDL for constraint update action replacement
 * Note: This is not directly supported in PostgreSQL, would require DROP and re-ADD
 */
function generateAlterConstraintUpdateFromOperation(
  operation: ReplaceConstraintUpdateOperation,
): Result<string, Error> {
  const pathInfo = extractTableAndConstraintNameFromUpdatePath(operation.path)
  if (!pathInfo) {
    return err(new Error(`Invalid constraint update path: ${operation.path}`))
  }

  // PostgreSQL doesn't support ALTER CONSTRAINT for changing actions
  // This would require DROP CONSTRAINT and ADD CONSTRAINT with new action
  return err(
    new Error(
      'Altering constraint update action is not directly supported. Drop and recreate the constraint.',
    ),
  )
}

export const postgresqlOperationDeparser: OperationDeparser = (
  operation: Operation,
) => {
  const errors: { message: string }[] = []

  if (isAddTableOperation(operation)) {
    const result = generateCreateTableFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isRemoveTableOperation(operation)) {
    const result = generateRemoveTableFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceTableNameOperation(operation)) {
    const result = generateRenameTableFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isAddColumnOperation(operation)) {
    const result = generateAddColumnFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isRemoveColumnOperation(operation)) {
    const result = generateRemoveColumnFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isRenameColumnOperation(operation)) {
    const result = generateRenameColumnFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isAddIndexOperation(operation)) {
    const result = generateCreateIndexFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isRemoveIndexOperation(operation)) {
    const result = generateRemoveIndexFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isAddConstraintOperation(operation)) {
    const result = generateAddConstraintFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isRemoveConstraintOperation(operation)) {
    const result = generateRemoveConstraintFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceColumnTypeOperation(operation)) {
    const result = generateAlterColumnTypeFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceColumnNotNullOperation(operation)) {
    const result = generateAlterColumnNotNullFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceColumnDefaultOperation(operation)) {
    const result = generateAlterColumnDefaultFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceTableCommentOperation(operation)) {
    const result = generateTableCommentFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceColumnCommentOperation(operation)) {
    const result = generateColumnCommentFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceColumnCheckOperation(operation)) {
    const result = generateAlterColumnCheckFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceConstraintDeleteOperation(operation)) {
    const result = generateAlterConstraintDeleteFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  if (isReplaceConstraintUpdateOperation(operation)) {
    const result = generateAlterConstraintUpdateFromOperation(operation)
    if (result.isErr()) {
      errors.push({ message: result.error.message })
      return { value: '', errors }
    }
    const value = result.value
    return { value, errors }
  }

  return {
    value: '',
    errors: [
      {
        message: 'Unsupported operation type',
      },
    ],
  }
}
