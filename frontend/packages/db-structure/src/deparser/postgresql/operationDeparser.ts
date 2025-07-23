import { err, ok, type Result } from 'neverthrow'
import { PATH_PATTERNS } from '../../operation/constants.js'
import type {
  AddColumnOperation,
  RemoveColumnOperation,
  RenameColumnOperation,
} from '../../operation/schema/column.js'
import {
  isAddColumnOperation,
  isRemoveColumnOperation,
  isRenameColumnOperation,
} from '../../operation/schema/column.js'
import type {
  AddConstraintOperation,
  RemoveConstraintOperation,
} from '../../operation/schema/constraint.js'
import {
  isAddConstraintOperation,
  isRemoveConstraintOperation,
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
  ReplaceTableNameOperation,
} from '../../operation/schema/table.js'
import {
  isAddTableOperation,
  isRemoveTableOperation,
  isReplaceTableNameOperation,
} from '../../operation/schema/table.js'
import type { OperationDeparser } from '../type.js'
import {
  generateAddColumnStatement,
  generateAddConstraintStatement,
  generateCreateIndexStatement,
  generateCreateTableStatement,
  generateRemoveColumnStatement,
  generateRemoveConstraintStatement,
  generateRemoveIndexStatement,
  generateRemoveTableStatement,
  generateRenameColumnStatement,
  generateRenameTableStatement,
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

  return {
    value: '',
    errors: [
      {
        message: 'Unsupported operation type',
      },
    ],
  }
}
