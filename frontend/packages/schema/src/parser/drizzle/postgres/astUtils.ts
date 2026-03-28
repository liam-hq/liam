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
  TemplateLiteral,
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
const isPgTableCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'pgTable')
}
/**
 * Extract the base pgTable call from method chaining patterns
 * Handles patterns like: pgTable(...).enableRLS(), pgTable(...).comment(...), etc.
 */
export const extractPgTableFromChain = (
  callExpr: CallExpression,
): CallExpression | null => {
  // If it's already a direct pgTable call, return it
  if (isPgTableCall(callExpr)) {
    return callExpr
  }

  // If it's a method call on another expression, check the object
  if (callExpr.callee.type === 'MemberExpression') {
    const baseCall = callExpr.callee.object
    if (baseCall.type === 'CallExpression') {
      // Recursively check if the base call is or contains a pgTable call
      return extractPgTableFromChain(baseCall)
    }
  }

  return null
}

/**
 * Check if a call expression is a schema.table() call
 */
export const isSchemaTableCall = (callExpr: CallExpression): boolean => {
  return (
    isMemberExpression(callExpr.callee) &&
    isIdentifier(callExpr.callee.property) &&
    callExpr.callee.property.value === 'table'
  )
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

/**
 * Check if a call expression calls a function with a specific name
 */
export const isCallToFunction = (
  callExpr: CallExpression,
  functionName: string,
): boolean => {
  return (
    isIdentifier(callExpr.callee) &&
    callExpr.callee.value === functionName &&
    callExpr.arguments.length > 0
  )
}

/**
 * Extract column names from an array expression of member expressions
 * Handles patterns like: [table.column1, table.column2]
 */
export const extractColumnNames = (expr: Expression): string[] => {
  if (!isArrayExpression(expr)) return []

  const columns: string[] = []

  for (const elem of expr.elements) {
    if (!elem) continue
    const elemExpr = getArgumentExpression(elem)
    if (!elemExpr) continue
    if (!isMemberExpression(elemExpr)) continue
    if (!isIdentifier(elemExpr.property)) continue

    columns.push(elemExpr.property.value)
  }

  return columns
}

/**
 * Extract table and column names from member expressions in an array
 * Returns the first table name found and all column names
 * Handles patterns like: [table.col1, table.col2] or mixed [table1.col1, table2.col2]
 */
export const extractTableAndColumns = (
  expr: Expression,
): { tableName: string | null; columnNames: string[] } => {
  if (!isArrayExpression(expr)) {
    return { tableName: null, columnNames: [] }
  }

  const columnNames: string[] = []
  let tableName: string | null = null

  for (const elem of expr.elements) {
    if (!elem) continue
    const elemExpr = getArgumentExpression(elem)

    if (
      elemExpr &&
      isMemberExpression(elemExpr) &&
      isIdentifier(elemExpr.object) &&
      isIdentifier(elemExpr.property)
    ) {
      tableName = tableName ?? elemExpr.object.value
      columnNames.push(elemExpr.property.value)
    }
  }

  return { tableName, columnNames }
}

/**
 * Reconstruct a sql template literal condition string from quasis and expressions.
 * For MemberExpression like table.age, extracts the JS property name (e.g., "age").
 * Falls back to "?" for other expression types.
 * e.g. sql`${table.age} >= 0` → "age >= 0"
 */
export const reconstructSqlTemplate = (template: TemplateLiteral): string => {
  const parts: string[] = []
  for (let i = 0; i < template.quasis.length; i++) {
    const quasi = template.quasis[i]
    if (quasi) parts.push(quasi.raw)
    if (i < template.expressions.length) {
      const expr = template.expressions[i]
      if (
        expr &&
        expr.type === 'MemberExpression' &&
        expr.property.type === 'Identifier'
      ) {
        parts.push(expr.property.value)
      } else {
        parts.push('?')
      }
    }
  }
  return parts.join('')
}

/**
 * Extract configuration object from a call expression's first argument
 */
export const extractConfigObject = (
  callExpr: CallExpression,
): ObjectExpression | null => {
  if (callExpr.arguments.length === 0) return null

  const configArg = callExpr.arguments[0]
  const configExpr = getArgumentExpression(configArg)
  return isObjectExpression(configExpr) ? configExpr : null
}
