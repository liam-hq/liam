/**
 * Enum definition parsing for Drizzle ORM MySQL schema parsing
 */

import type { CallExpression } from '@swc/core'
import {
  getArgumentExpression,
  getStringValue,
  isArrayExpression,
} from './astUtils.js'
import type { DrizzleEnumDefinition } from './types.js'

/**
 * Parse mysqlEnum call expression
 */
export const parseMysqlEnumCall = (
  callExpr: CallExpression,
): DrizzleEnumDefinition | null => {
  if (callExpr.arguments.length < 2) return null

  const enumNameArg = callExpr.arguments[0]
  const valuesArg = callExpr.arguments[1]

  if (!enumNameArg || !valuesArg) return null

  // Extract expression from SWC argument structure
  const enumNameExpr = getArgumentExpression(enumNameArg)
  const valuesExpr = getArgumentExpression(valuesArg)

  const enumName = enumNameExpr ? getStringValue(enumNameExpr) : null
  if (!enumName || !valuesExpr || !isArrayExpression(valuesExpr)) return null

  const values: string[] = []
  for (const element of valuesExpr.elements) {
    if (!element) continue
    const expr = 'expression' in element ? element.expression : element
    const str = getStringValue(expr)
    if (typeof str === 'string') values.push(str)
  }

  return { name: enumName, values }
}
