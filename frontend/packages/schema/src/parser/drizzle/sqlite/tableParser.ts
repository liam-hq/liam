/**
 * Table structure parsing for Drizzle ORM schema parsing
 */

import type {
  ArrayExpression,
  CallExpression,
  Expression,
  ObjectExpression,
} from '@swc/core'
import {
  extractSqliteTableFromChain,
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isObjectExpression,
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
 * Parse sqliteTable call with comment method chain
 */
export const parseSqliteTableWithComment = (
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

  // Get the sqliteTable call from the chain
  if (commentCallExpr.callee.type === 'MemberExpression') {
    const chainCall = commentCallExpr.callee.object
    if (chainCall.type === 'CallExpression') {
      // Use extractSqliteTableFromChain to handle complex method chaining
      const sqliteTableCall = extractSqliteTableFromChain(chainCall)
      if (sqliteTableCall) {
        const table = parseSqliteTableCall(sqliteTableCall)
        if (table && comment) {
          table.comment = comment
        }
        return table
      }
    }
  }

  return null
}

/**
 * Parse sqliteTable call expression
 */
export const parseSqliteTableCall = (
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

  parseTableColumns(columnsExpr, table)

  // Parse indexes and composite primary key from third argument if present
  if (callExpr.arguments.length > 2) {
    const thirdArgExpr = getArgumentExpression(callExpr.arguments[2])
    if (thirdArgExpr) {
      parseTableExtras(thirdArgExpr, table)
    }
  }

  return table
}

/**
 * Parse columns from the object expression
 */
const parseTableColumns = (
  columnsExpr: ObjectExpression,
  table: DrizzleTableDefinition,
): void => {
  for (const prop of columnsExpr.properties) {
    if (prop.type !== 'KeyValueProperty') continue

    const column = parseColumnFromProperty(prop)
    if (!column) continue

    // Use the JS property name as the key
    const jsPropertyName =
      prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
    if (jsPropertyName) {
      table.columns[jsPropertyName] = column
    }
  }
}

/**
 * Register a parsed index or composite primary key on the table
 */
const addIndexDefinition = (
  table: DrizzleTableDefinition,
  indexDef: DrizzleIndexDefinition | CompositePrimaryKeyDefinition | null,
): void => {
  if (isCompositePrimaryKey(indexDef)) {
    table.compositePrimaryKey = indexDef
  } else if (isDrizzleIndex(indexDef)) {
    table.indexes[indexDef.name] = indexDef
  }
}

/**
 * Parse indexes and composite primary keys from the third argument callback.
 * Supports both the array form (table) => [index(...)] and the legacy
 * object form (table) => ({ nameIdx: index(...) })
 */
const parseTableExtras = (
  expr: Expression,
  table: DrizzleTableDefinition,
): void => {
  if (expr.type !== 'ArrowFunctionExpression') return

  let returnExpr = expr.body

  // Handle parenthesized expressions like (table) => ({ ... })
  if (returnExpr.type === 'ParenthesisExpression') {
    returnExpr = returnExpr.expression
  }

  if (returnExpr.type === 'ArrayExpression') {
    parseArrayExtras(returnExpr, table)
  } else if (returnExpr.type === 'ObjectExpression') {
    parseObjectExtras(returnExpr, table)
  }
}

/**
 * Parse extras in array form: [index(...), primaryKey(...)]
 */
const parseArrayExtras = (
  arrayExpr: ArrayExpression,
  table: DrizzleTableDefinition,
): void => {
  for (const element of arrayExpr.elements) {
    const elementExpr = getArgumentExpression(element)
    if (elementExpr && elementExpr.type === 'CallExpression') {
      addIndexDefinition(table, parseIndexDefinition(elementExpr, ''))
    }
  }
}

/**
 * Parse extras in object form: { nameIdx: index(...), pk: primaryKey(...) }
 */
const parseObjectExtras = (
  objectExpr: ObjectExpression,
  table: DrizzleTableDefinition,
): void => {
  for (const prop of objectExpr.properties) {
    if (prop.type !== 'KeyValueProperty') continue

    const indexName =
      prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
    if (indexName && prop.value.type === 'CallExpression') {
      addIndexDefinition(table, parseIndexDefinition(prop.value, indexName))
    }
  }
}

/**
 * Parse primaryKey({ columns: [...] }) definition
 */
const parseCompositePrimaryKey = (
  callExpr: CallExpression,
): CompositePrimaryKeyDefinition | null => {
  if (callExpr.arguments.length === 0) return null

  const configExpr = getArgumentExpression(callExpr.arguments[0])
  if (!configExpr || !isObjectExpression(configExpr)) return null

  const config = parseObjectExpression(configExpr)
  if (!config['columns'] || !Array.isArray(config['columns'])) return null

  return {
    type: 'primaryKey',
    columns: config['columns'].filter(
      (col): col is string => typeof col === 'string',
    ),
  }
}

/**
 * Parse the base index() or uniqueIndex() call to extract name and uniqueness
 */
const parseIndexBase = (
  expr: Expression,
  fallbackName: string,
): { name: string; unique: boolean } => {
  if (expr.type !== 'CallExpression' || expr.callee.type !== 'Identifier') {
    return { name: fallbackName, unique: false }
  }

  const baseMethod = expr.callee.value
  if (baseMethod !== 'index' && baseMethod !== 'uniqueIndex') {
    return { name: fallbackName, unique: false }
  }

  let name = fallbackName
  if (expr.arguments.length > 0) {
    const nameExpr = getArgumentExpression(expr.arguments[0])
    if (nameExpr && isStringLiteral(nameExpr)) {
      name = nameExpr.value
    }
  }

  return { name, unique: baseMethod === 'uniqueIndex' }
}

/**
 * Collect column references from .on(...) calls in the method chain
 */
const collectOnColumns = (
  methodCalls: Array<{ method: string; expr: CallExpression }>,
): string[] => {
  const columns: string[] = []

  for (const { method, expr } of methodCalls) {
    if (method !== 'on') continue

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
  }

  return columns
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
    return parseCompositePrimaryKey(callExpr)
  }

  // Handle index('name').on(...) or uniqueIndex('name').on(...)
  // Traverse the method chain to find index() and on() calls
  const methodCalls: Array<{ method: string; expr: CallExpression }> = []
  let currentExpr: Expression = callExpr

  while (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'MemberExpression' &&
    currentExpr.callee.property.type === 'Identifier'
  ) {
    methodCalls.unshift({
      method: currentExpr.callee.property.value,
      expr: currentExpr,
    })
    currentExpr = currentExpr.callee.object
  }

  const { name: indexName, unique } = parseIndexBase(currentExpr, name)
  const columns = collectOnColumns(methodCalls)

  if (columns.length === 0) return null

  return {
    name: indexName,
    columns,
    unique,
    type: '',
  }
}
