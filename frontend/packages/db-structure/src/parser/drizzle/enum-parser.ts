/**
 * Enum definition parsing for Drizzle ORM schema parsing
 */

import type { CallExpression } from '@swc/core'
import {
  getArgumentExpression,
  getStringValue,
  isArrayExpression,
  isStringLiteral,
} from './ast-utils.js'
import type { DrizzleEnumDefinition } from './types.js'

/**
 * Parse pgEnum call expression
 */
export const parsePgEnumCall = (
  callExpr: unknown,
): DrizzleEnumDefinition | null => {
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

  const enumNameArg = expr.arguments[0]
  const valuesArg = expr.arguments[1]

  if (!enumNameArg || !valuesArg) return null

  // Extract expression from SWC argument structure
  const enumNameExpr = getArgumentExpression(enumNameArg)
  const valuesExpr = getArgumentExpression(valuesArg)

  const enumName = enumNameExpr ? getStringValue(enumNameExpr) : null
  if (!enumName || !valuesExpr || !isArrayExpression(valuesExpr)) return null

  const values: string[] = []
  for (const element of valuesExpr.elements) {
    if (isStringLiteral(element)) {
      values.push(element.value)
    }
  }

  return { name: enumName, values }
}
