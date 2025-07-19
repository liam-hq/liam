/**
 * Expression parsing utilities for Drizzle ORM schema parsing
 */

import type { Expression, ObjectExpression } from '@swc/core'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isArrayExpression,
  isIdentifier,
  isMemberExpression,
} from './astUtils.js'
import { getPropertyValue, hasProperty, isObject } from './types.js'

/**
 * Parse default value from expression
 */
export const parseDefaultValue = (expr: Expression): unknown => {
  switch (expr.type) {
    case 'StringLiteral':
      return expr.value
    case 'NumericLiteral':
      return expr.value
    case 'BooleanLiteral':
      return expr.value
    case 'NullLiteral':
      return null
    case 'Identifier':
      // Handle special cases like defaultRandom, defaultNow
      switch (expr.value) {
        case 'defaultRandom':
          return 'defaultRandom'
        case 'defaultNow':
          return 'now()'
        default:
          return expr.value
      }
    case 'CallExpression':
      // Handle function calls like defaultNow()
      if (expr.callee.type === 'Identifier') {
        switch (expr.callee.value) {
          case 'defaultNow':
            return 'now()'
          case 'defaultRandom':
            return 'defaultRandom'
          default:
            return expr.callee.value
        }
      }
      return undefined
    default:
      return undefined
  }
}

/**
 * Parse object expression to plain object
 */
export const parseObjectExpression = (
  obj: ObjectExpression,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  for (const prop of obj.properties) {
    if (prop.type === 'KeyValueProperty') {
      const key =
        prop.key.type === 'Identifier'
          ? getIdentifierName(prop.key)
          : prop.key.type === 'StringLiteral'
            ? getStringValue(prop.key)
            : null
      if (key) {
        result[key] = parsePropertyValue(prop.value)
      }
    }
  }

  return result
}

/**
 * Type guard for expression-like objects
 */
const isExpressionLike = (value: unknown): value is Expression => {
  return (
    isObject(value) &&
    hasProperty(value, 'type') &&
    typeof getPropertyValue(value, 'type') === 'string'
  )
}

/**
 * Safe parser for unknown values as expressions
 */
const parseUnknownValue = (value: unknown): unknown => {
  if (isExpressionLike(value)) {
    return parseDefaultValue(value)
  }
  return value
}

/**
 * Parse property value (including arrays)
 */
const parsePropertyValue = (expr: unknown): unknown => {
  if (isArrayExpression(expr)) {
    const result: unknown[] = []
    for (const element of expr.elements) {
      const elementExpr = getArgumentExpression(element)
      if (
        elementExpr &&
        elementExpr.type === 'MemberExpression' &&
        elementExpr.object.type === 'Identifier' &&
        elementExpr.property.type === 'Identifier'
      ) {
        // For table.columnName references, use the property name
        result.push(elementExpr.property.value)
      } else if (
        isMemberExpression(element) &&
        isIdentifier(element.object) &&
        isIdentifier(element.property)
      ) {
        // Direct MemberExpression (not wrapped in { expression })
        result.push(element.property.value)
      } else {
        const parsed = elementExpr
          ? parseDefaultValue(elementExpr)
          : parseUnknownValue(element)
        result.push(parsed)
      }
    }
    return result
  }
  return parseUnknownValue(expr)
}
