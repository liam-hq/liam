/**
 * AST manipulation utilities for Drizzle ORM schema parsing
 */

import type {
  Argument,
  CallExpression,
  Expression,
  Import,
  ObjectExpression,
  Super,
} from '@swc/core'
import { getPropertyValue, hasProperty, isObject } from './types.js'

/**
 * Type guard for SWC Argument wrapper
 */
const isArgumentWrapper = (arg: unknown): arg is { expression: Expression } => {
  return isObject(arg) && hasProperty(arg, 'expression')
}

/**
 * Extract expression from SWC Argument wrapper
 */
export const getArgumentExpression = (arg: unknown): Expression | null => {
  if (isArgumentWrapper(arg)) {
    return arg.expression
  }
  return null
}

/**
 * Type guard for string literal expressions
 */
export const isStringLiteral = (
  expr: unknown,
): expr is { type: 'StringLiteral'; value: string } => {
  return (
    isObject(expr) &&
    getPropertyValue(expr, 'type') === 'StringLiteral' &&
    hasProperty(expr, 'value') &&
    typeof getPropertyValue(expr, 'value') === 'string'
  )
}

/**
 * Type guard for object expressions
 */
export const isObjectExpression = (expr: unknown): expr is ObjectExpression => {
  return isObject(expr) && getPropertyValue(expr, 'type') === 'ObjectExpression'
}

/**
 * Type guard for array expressions
 */
export const isArrayExpression = (
  expr: unknown,
): expr is { type: 'ArrayExpression'; elements: unknown[] } => {
  return (
    isObject(expr) &&
    getPropertyValue(expr, 'type') === 'ArrayExpression' &&
    hasProperty(expr, 'elements') &&
    Array.isArray(getPropertyValue(expr, 'elements'))
  )
}

/**
 * Type guard for identifier nodes
 */
export const isIdentifier = (
  node: unknown,
): node is { type: 'Identifier'; value: string } => {
  return (
    isObject(node) &&
    getPropertyValue(node, 'type') === 'Identifier' &&
    hasProperty(node, 'value') &&
    typeof getPropertyValue(node, 'value') === 'string'
  )
}

/**
 * Check if a node is an identifier with a specific name
 */
const isIdentifierWithName = (
  node: Expression | Super | Import,
  name: string,
): boolean => {
  return isIdentifier(node) && node.value === name
}

/**
 * Type guard for member expressions
 */
export const isMemberExpression = (
  node: unknown,
): node is {
  type: 'MemberExpression'
  object: { type: string; value?: string }
  property: { type: string; value?: string }
} => {
  return (
    isObject(node) &&
    getPropertyValue(node, 'type') === 'MemberExpression' &&
    hasProperty(node, 'object') &&
    hasProperty(node, 'property') &&
    typeof getPropertyValue(node, 'object') === 'object' &&
    typeof getPropertyValue(node, 'property') === 'object'
  )
}

/**
 * Check if a call expression is a pgTable call
 */
export const isPgTableCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'pgTable')
}

/**
 * Extract string value from a string literal
 */
export const getStringValue = (node: Expression): string | null => {
  if (node.type === 'StringLiteral') {
    return node.value
  }
  return null
}

/**
 * Extract identifier name
 */
export const getIdentifierName = (node: Expression): string | null => {
  if (isIdentifier(node)) {
    return node.value
  }
  return null
}

/**
 * Parse method call chain from a call expression
 */
export const parseMethodChain = (
  expr: Expression,
): Array<{ name: string; args: Argument[] }> => {
  const methods: Array<{ name: string; args: Argument[] }> = []
  let current = expr

  while (current.type === 'CallExpression') {
    if (
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier'
    ) {
      methods.unshift({
        name: current.callee.property.value,
        args: current.arguments,
      })
      current = current.callee.object
    } else {
      break
    }
  }

  return methods
}
