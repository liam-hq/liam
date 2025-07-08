/**
 * Table structure parsing for Drizzle ORM schema parsing
 */

import type { CallExpression, Expression } from '@swc/core'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isObjectExpression,
  isPgTableCall,
  isStringLiteral,
} from './astUtils.js'
import { parseColumnFromProperty } from './columnParser.js'
import { parseObjectExpression } from './expressionParser.js'
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
  commentCallExpr: CallExpression,
): DrizzleTableDefinition | null => {
  // Extract the comment from the call arguments
  let comment: string | null = null
  if (commentCallExpr.arguments.length > 0) {
    const commentArg = commentCallExpr.arguments[0]
    const commentExpr = getArgumentExpression(commentArg)
    if (commentExpr && isStringLiteral(commentExpr)) {
      comment = commentExpr.value
    }
  }

  // Get the pgTable call from the object of the member expression
  if (commentCallExpr.callee.type === 'MemberExpression') {
    const pgTableCall = commentCallExpr.callee.object
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
  callExpr: CallExpression,
): DrizzleTableDefinition | null => {
  if (callExpr.arguments.length < 2) return null

  const tableNameArg = callExpr.arguments[0]
  const columnsArg = callExpr.arguments[1]

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
  if (callExpr.arguments.length > 2) {
    const thirdArg = callExpr.arguments[2]
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

  // Handle index('name').on(...) or uniqueIndex('name').on(...) with optional .using(...)
  let isUnique = false
  let indexName = name
  let indexType = '' // Index type (btree, gin, gist, etc.)
  let currentExpr: Expression = callExpr

  // Traverse the method chain to find index(), on(), and using() calls
  const methodCalls: Array<{ method: string; expr: CallExpression }> = []

  while (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'MemberExpression' &&
    currentExpr.callee.property.type === 'Identifier'
  ) {
    const methodName = currentExpr.callee.property.value
    methodCalls.unshift({ method: methodName, expr: currentExpr })
    currentExpr = currentExpr.callee.object
  }

  // The base should be index() or uniqueIndex()
  if (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'Identifier'
  ) {
    const baseMethod = currentExpr.callee.value
    if (baseMethod === 'index' || baseMethod === 'uniqueIndex') {
      isUnique = baseMethod === 'uniqueIndex'
      // Get the index name from the first argument
      if (currentExpr.arguments.length > 0) {
        const nameArg = currentExpr.arguments[0]
        const nameExpr = getArgumentExpression(nameArg)
        if (nameExpr && isStringLiteral(nameExpr)) {
          indexName = nameExpr.value
        }
      }
    }
  }

  // Parse method chain to extract columns and index type
  const columns: string[] = []

  for (const { method, expr } of methodCalls) {
    if (method === 'on') {
      // Parse column references from .on(...) arguments
      for (const arg of expr.arguments) {
        const argExpr = getArgumentExpression(arg)
        if (
          argExpr &&
          argExpr.type === 'MemberExpression' &&
          argExpr.object.type === 'Identifier' &&
          argExpr.property.type === 'Identifier'
        ) {
          columns.push(argExpr.property.value)
        }
      }
    } else if (method === 'using') {
      // Parse index type from .using('type', ...) - first argument is the type
      if (expr.arguments.length > 0) {
        const typeArg = expr.arguments[0]
        const typeExpr = getArgumentExpression(typeArg)
        if (typeExpr && isStringLiteral(typeExpr)) {
          indexType = typeExpr.value
        }
      }
      // Also parse columns from remaining arguments if present
      for (let i = 1; i < expr.arguments.length; i++) {
        const arg = expr.arguments[i]
        const argExpr = getArgumentExpression(arg)
        if (
          argExpr &&
          argExpr.type === 'MemberExpression' &&
          argExpr.object.type === 'Identifier' &&
          argExpr.property.type === 'Identifier'
        ) {
          columns.push(argExpr.property.value)
        }
      }
    }
  }

  if (columns.length > 0) {
    return {
      name: indexName,
      columns,
      unique: isUnique,
      type: indexType,
    }
  }

  return null
}
