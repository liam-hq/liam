/**
 * Shared index parsing logic for Drizzle parsers
 */

import type { CallExpression, Expression } from '@swc/core'
import type {
  CompositePrimaryKeyDefinition,
  DrizzleIndexDefinition,
} from '../mysql/types.js'
import {
  getArgumentExpression,
  isObjectExpression,
  isStringLiteral,
} from './astUtils.js'
import { parseObjectExpression } from './expressionParser.js'

/**
 * Parse index or primary key definition - shared logic between MySQL and PostgreSQL
 */
export const parseIndexDefinition = (
  callExpr: CallExpression,
  name: string,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
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
  let indexType = '' // Index type (btree, hash, gin, gist, etc.)
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
      // Parse index type from .using('type') - first argument is the type
      if (expr.arguments.length > 0) {
        const typeArg = expr.arguments[0]
        const typeExpr = getArgumentExpression(typeArg)
        if (typeExpr && isStringLiteral(typeExpr)) {
          indexType = typeExpr.value
        }
      }
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
