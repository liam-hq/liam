/**
 * Schema parsing for Drizzle ORM MySQL schema parsing
 */

import type { CallExpression } from '@swc/core'
import { getArgumentExpression, getStringValue } from './astUtils.js'
import type { DrizzleSchemaDefinition } from './types.js'

/**
 * Parse mysqlSchema call expression
 */
export const parseMysqlSchemaCall = (
  callExpr: CallExpression,
): DrizzleSchemaDefinition | null => {
  if (callExpr.arguments.length < 1) return null

  const schemaNameArg = callExpr.arguments[0]
  if (!schemaNameArg) return null

  // Extract expression from SWC argument structure
  const schemaNameExpr = getArgumentExpression(schemaNameArg)
  const schemaName = schemaNameExpr ? getStringValue(schemaNameExpr) : null

  if (!schemaName) return null

  return {
    name: schemaName,
  }
}
