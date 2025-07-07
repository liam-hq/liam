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
): string {
  const tableName = extractTableNameFromPath(operation.path)
  if (!tableName) {
    throw new Error(`Invalid table path: ${operation.path}`)
  }

  const table = operation.value
  const ddlStatements: string[] = []

  // 1. Generate CREATE TABLE statement (includes comments)
  ddlStatements.push(generateCreateTableStatement(table))

  // 2. Generate ADD CONSTRAINT statements
  for (const constraint of Object.values(table.constraints)) {
    ddlStatements.push(generateAddConstraintStatement(table.name, constraint))
  }

  return ddlStatements.join('\n\n')
}

/**
 * Generate ADD COLUMN DDL from column creation operation
 */
function generateAddColumnFromOperation(operation: AddColumnOperation): string {
  const pathInfo = extractTableAndColumnNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid column path: ${operation.path}`)
  }

  return generateAddColumnStatement(pathInfo.tableName, operation.value)
}

/**
 * Generate DROP COLUMN DDL from column removal operation
 */
function generateRemoveColumnFromOperation(
  operation: RemoveColumnOperation,
): string {
  const pathInfo = extractTableAndColumnNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid column path: ${operation.path}`)
  }

  return generateRemoveColumnStatement(pathInfo.tableName, pathInfo.columnName)
}

/**
 * Generate RENAME COLUMN DDL from column rename operation
 */
function generateRenameColumnFromOperation(
  operation: RenameColumnOperation,
): string {
  const pathInfo = extractTableAndColumnNameFromNamePath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid column name path: ${operation.path}`)
  }

  return generateRenameColumnStatement(
    pathInfo.tableName,
    pathInfo.columnName,
    operation.value,
  )
}

/**
 * Generate DROP TABLE DDL from table removal operation
 */
function generateRemoveTableFromOperation(
  operation: RemoveTableOperation,
): string {
  const tableName = extractTableNameFromPath(operation.path)
  if (!tableName) {
    throw new Error(`Invalid table path: ${operation.path}`)
  }

  return generateRemoveTableStatement(tableName)
}

/**
 * Generate RENAME TABLE DDL from table rename operation
 */
function generateRenameTableFromOperation(
  operation: ReplaceTableNameOperation,
): string {
  const tableName = extractTableNameFromNamePath(operation.path)
  if (!tableName) {
    throw new Error(`Invalid table name path: ${operation.path}`)
  }

  return generateRenameTableStatement(tableName, operation.value)
}

/**
 * Generate CREATE INDEX DDL from index creation operation
 */
function generateCreateIndexFromOperation(
  operation: AddIndexOperation,
): string {
  const pathInfo = extractTableAndIndexNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid index path: ${operation.path}`)
  }

  return generateCreateIndexStatement(pathInfo.tableName, operation.value)
}

/**
 * Generate DROP INDEX DDL from index removal operation
 */
function generateRemoveIndexFromOperation(
  operation: RemoveIndexOperation,
): string {
  const pathInfo = extractTableAndIndexNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid index path: ${operation.path}`)
  }

  return generateRemoveIndexStatement(pathInfo.indexName)
}

/**
 * Generate ADD CONSTRAINT DDL from constraint creation operation
 */
function generateAddConstraintFromOperation(
  operation: AddConstraintOperation,
): string {
  const pathInfo = extractTableAndConstraintNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid constraint path: ${operation.path}`)
  }

  return generateAddConstraintStatement(pathInfo.tableName, operation.value)
}

/**
 * Generate DROP CONSTRAINT DDL from constraint removal operation
 */
function generateRemoveConstraintFromOperation(
  operation: RemoveConstraintOperation,
): string {
  const pathInfo = extractTableAndConstraintNameFromPath(operation.path)
  if (!pathInfo) {
    throw new Error(`Invalid constraint path: ${operation.path}`)
  }

  return generateRemoveConstraintStatement(
    pathInfo.tableName,
    pathInfo.constraintName,
  )
}

export const postgresqlOperationDeparser: OperationDeparser = (
  operation: Operation,
) => {
  const errors: { message: string }[] = []

  if (isAddTableOperation(operation)) {
    const value = generateCreateTableFromOperation(operation)
    return { value, errors }
  }

  if (isRemoveTableOperation(operation)) {
    const value = generateRemoveTableFromOperation(operation)
    return { value, errors }
  }

  if (isReplaceTableNameOperation(operation)) {
    const value = generateRenameTableFromOperation(operation)
    return { value, errors }
  }

  if (isAddColumnOperation(operation)) {
    const value = generateAddColumnFromOperation(operation)
    return { value, errors }
  }

  if (isRemoveColumnOperation(operation)) {
    const value = generateRemoveColumnFromOperation(operation)
    return { value, errors }
  }

  if (isRenameColumnOperation(operation)) {
    const value = generateRenameColumnFromOperation(operation)
    return { value, errors }
  }

  if (isAddIndexOperation(operation)) {
    const value = generateCreateIndexFromOperation(operation)
    return { value, errors }
  }

  if (isRemoveIndexOperation(operation)) {
    const value = generateRemoveIndexFromOperation(operation)
    return { value, errors }
  }

  if (isAddConstraintOperation(operation)) {
    const value = generateAddConstraintFromOperation(operation)
    return { value, errors }
  }

  if (isRemoveConstraintOperation(operation)) {
    const value = generateRemoveConstraintFromOperation(operation)
    return { value, errors }
  }

  return {
    value: '',
    errors: [
      {
        message: `Unsupported operation: ${operation.op} at path ${operation.path}`,
      },
    ],
  }
}
