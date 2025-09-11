/**
 * MySQL-specific AST manipulation utilities for Drizzle ORM schema parsing
 */

import type { CallExpression } from '@swc/core'
import { isIdentifierWithName } from '../shared/astUtils.js'

/**
 * Check if a call expression is a mysqlTable call
 */
export const isMysqlTableCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'mysqlTable')
}

/**
 * Check if a call expression is a mysqlSchema call
 */
export const isMysqlSchemaCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'mysqlSchema')
}
