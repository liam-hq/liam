/**
 * Table structure parsing for Drizzle ORM schema parsing
 */

import type { CallExpression } from '@swc/core'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isObjectExpression,
  isPgTableCall,
  isStringLiteral,
} from './ast-utils.js'
import { parseColumnFromProperty } from './column-parser.js'
import { parseObjectExpression } from './expression-parser.js'
import type {
  CompositePrimaryKeyDefinition,
  DrizzleIndexDefinition,
  DrizzleTableDefinition,
} from './types.js'
import { isCompositePrimaryKey, isDrizzleIndex } from './types.js'

/**
 * Parse pgTable call with comment method chain
 */
export const parsePgTableWithComment = (
  commentCallExpr: unknown,
): DrizzleTableDefinition | null => {
  // Type guard for CallExpression
  if (typeof commentCallExpr !== 'object' || commentCallExpr === null) {
    return null
  }

  const expr = commentCallExpr as CallExpression
  // Extract the comment from the call arguments
  let comment: string | null = null
  if (expr.arguments.length > 0) {
    const commentArg = expr.arguments[0]
    const commentExpr = getArgumentExpression(commentArg)
    if (commentExpr && isStringLiteral(commentExpr)) {
      comment = commentExpr.value
    }
  }

  // Get the pgTable call from the object of the member expression
  if (expr.callee.type === 'MemberExpression') {
    const pgTableCall = expr.callee.object
    if (pgTableCall.type === 'CallExpression' && isPgTableCall(pgTableCall)) {
      const table = parsePgTableCall(pgTableCall)
      if (table && comment) {
        table.comment = comment
      }
      return table
    }
  }

  return null
}

/**
 * Parse pgTable call expression
 */
export const parsePgTableCall = (
  callExpr: unknown,
): DrizzleTableDefinition | null => {
  // Type guard for CallExpression
  if (
    typeof callExpr !== 'object' ||
    callExpr === null ||
    !('arguments' in callExpr)
  ) {
    return null
  }

  const expr = callExpr as CallExpression
  if (expr.arguments.length < 2) return null

  const tableNameArg = expr.arguments[0]
  const columnsArg = expr.arguments[1]

  if (!tableNameArg || !columnsArg) return null

  // Extract expression from SWC argument structure
  const tableNameExpr = getArgumentExpression(tableNameArg)
  const columnsExpr = getArgumentExpression(columnsArg)

  const tableName = tableNameExpr ? getStringValue(tableNameExpr) : null
  if (!tableName || !columnsExpr || !isObjectExpression(columnsExpr))
    return null

  const table: DrizzleTableDefinition = {
    name: tableName,
    columns: {},
    indexes: {},
  }

  // Parse columns from the object expression
  for (const prop of columnsExpr.properties) {
    if (prop.type === 'KeyValueProperty') {
      const column = parseColumnFromProperty(prop)
      if (column) {
        // Use the JS property name as the key
        const jsPropertyName =
          prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
        if (jsPropertyName) {
          table.columns[jsPropertyName] = column
        }
      }
    }
  }

  // Parse indexes and composite primary key from third argument if present
  if (expr.arguments.length > 2) {
    const thirdArg = expr.arguments[2]
    const thirdArgExpr = getArgumentExpression(thirdArg)
    if (thirdArgExpr && thirdArgExpr.type === 'ArrowFunctionExpression') {
      // Parse arrow function like (table) => ({ nameIdx: index(...), pk: primaryKey(...) })
      let returnExpr = thirdArgExpr.body

      // Handle parenthesized expressions like (table) => ({ ... })
      if (returnExpr.type === 'ParenthesisExpression') {
        returnExpr = returnExpr.expression
      }

      if (returnExpr.type === 'ObjectExpression') {
        for (const prop of returnExpr.properties) {
          if (prop.type === 'KeyValueProperty') {
            const indexName =
              prop.key.type === 'Identifier'
                ? getIdentifierName(prop.key)
                : null
            if (indexName && prop.value.type === 'CallExpression') {
              const indexDef = parseIndexDefinition(prop.value, indexName)
              if (indexDef) {
                if (isCompositePrimaryKey(indexDef)) {
                  table.compositePrimaryKey = indexDef
                } else if (isDrizzleIndex(indexDef)) {
                  table.indexes[indexName] = indexDef
                }
              }
            }
          }
        }
      }
    }
  }

  return table
}

/**
 * Parse index or primary key definition
 */
const parseIndexDefinition = (
  callExpr: CallExpression,
  name: string,
): DrizzleIndexDefinition | CompositePrimaryKeyDefinition | null => {
  // Handle primaryKey({ columns: [...] })
  if (
    callExpr.callee.type === 'Identifier' &&
    callExpr.callee.value === 'primaryKey'
  ) {
    if (callExpr.arguments.length > 0) {
      const configArg = callExpr.arguments[0]
      const configExpr = getArgumentExpression(configArg)
      if (configExpr && isObjectExpression(configExpr)) {
        const config = parseObjectExpression(configExpr)
        if (config['columns'] && Array.isArray(config['columns'])) {
          const columns = config['columns'].filter(
            (col): col is string => typeof col === 'string',
          )
          return {
            type: 'primaryKey',
            columns,
          }
        }
      }
    }
    return null
  }

  // Handle index('name').on(...) or uniqueIndex('name').on(...)
  let isUnique = false
  let indexName = name
  let onCallExpr = callExpr

  // Check if this is a chained call like index('name').on(...)
  if (
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.property.type === 'Identifier' &&
    callExpr.callee.property.value === 'on'
  ) {
    onCallExpr = callExpr
    const indexCall = callExpr.callee.object
    if (
      indexCall.type === 'CallExpression' &&
      indexCall.callee.type === 'Identifier'
    ) {
      const indexType = indexCall.callee.value
      if (indexType === 'index' || indexType === 'uniqueIndex') {
        isUnique = indexType === 'uniqueIndex'
        // Get the index name from the first argument
        if (indexCall.arguments.length > 0) {
          const nameArg = indexCall.arguments[0]
          const nameExpr = getArgumentExpression(nameArg)
          if (nameExpr && isStringLiteral(nameExpr)) {
            indexName = nameExpr.value
          }
        }
      }
    }
  }

  // Parse column references from .on(...) arguments
  const columns: string[] = []
  for (const arg of onCallExpr.arguments) {
    const argExpr = getArgumentExpression(arg)
    if (
      argExpr &&
      argExpr.type === 'MemberExpression' &&
      argExpr.object.type === 'Identifier' &&
      argExpr.property.type === 'Identifier'
    ) {
      // This is table.columnName - we want the property name (JS property name)
      columns.push(argExpr.property.value)
    }
  }

  if (columns.length > 0) {
    return {
      name: indexName,
      columns,
      unique: isUnique,
      type: '',
    }
  }

  return null
}
