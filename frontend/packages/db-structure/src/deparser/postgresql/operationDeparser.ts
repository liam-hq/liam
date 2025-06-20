import type {
  AddColumnOperation,
  RemoveColumnOperation,
} from '../../operation/schema/column.js'
import {
  isAddColumnOperation,
  isRemoveColumnOperation,
} from '../../operation/schema/column.js'
import type { Operation } from '../../operation/schema/index.js'
import type { AddIndexOperation } from '../../operation/schema/index-operations.js'
import { isAddIndexOperation } from '../../operation/schema/index-operations.js'
import type {
  AddTableOperation,
  RemoveTableOperation,
} from '../../operation/schema/table.js'
import {
  isAddTableOperation,
  isRemoveTableOperation,
} from '../../operation/schema/table.js'
import type { OperationDeparser } from '../type.js'
import {
  generateAddColumnStatement,
  generateCreateIndexStatement,
  generateCreateTableStatement,
  generateRemoveColumnStatement,
  generateRemoveTableStatement,
} from './utils.js'

/**
 * Extract table name from operation path
 */
function extractTableNameFromPath(path: string): string | null {
  const match = path.match(/^\/tables\/([^/]+)/)
  return match?.[1] || null
}

/**
 * Extract table name and column name from column operation path
 */
function extractTableAndColumnNameFromPath(
  path: string,
): { tableName: string; columnName: string } | null {
  const match = path.match(/^\/tables\/([^/]+)\/columns\/([^/]+)$/)
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
  const match = path.match(/^\/tables\/([^/]+)\/indexes\/([^/]+)$/)
  if (!match || !match[1] || !match[2]) {
    return null
  }
  return {
    tableName: match[1],
    indexName: match[2],
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

  return generateCreateTableStatement(operation.value)
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

  if (isAddColumnOperation(operation)) {
    const value = generateAddColumnFromOperation(operation)
    return { value, errors }
  }

  if (isRemoveColumnOperation(operation)) {
    const value = generateRemoveColumnFromOperation(operation)
    return { value, errors }
  }

  if (isAddIndexOperation(operation)) {
    const value = generateCreateIndexFromOperation(operation)
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
