/**
 * PostgreSQL-specific AST manipulation utilities for Drizzle ORM schema parsing
 */

import type { CallExpression } from '@swc/core'
import { isIdentifierWithName } from '../shared/astUtils.js'

/**
 * Check if a call expression is a pgTable call
 */
export const isPgTableCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'pgTable')
}
