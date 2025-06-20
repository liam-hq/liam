import type { AddColumnOperation } from '../../operation/schema/column.js'
import { isAddColumnOperation } from '../../operation/schema/column.js'
import type { Operation } from '../../operation/schema/index.js'
import type { AddTableOperation } from '../../operation/schema/table.js'
import { isAddTableOperation } from '../../operation/schema/table.js'
import type { OperationDeparser } from '../type.js'
import {
  generateAddColumnStatement,
  generateCreateTableStatement,
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

export const postgresqlOperationDeparser: OperationDeparser = (
  operation: Operation,
) => {
  const errors: { message: string }[] = []

  if (isAddTableOperation(operation)) {
    const value = generateCreateTableFromOperation(operation)
    return { value, errors }
  }

  if (isAddColumnOperation(operation)) {
    const value = generateAddColumnFromOperation(operation)
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
