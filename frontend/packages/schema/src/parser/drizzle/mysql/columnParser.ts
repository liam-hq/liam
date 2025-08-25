/**
 * Column definition parsing for Drizzle ORM MySQL schema parsing
 */

import type { Argument, Expression, Property } from '@swc/core'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isArrayExpression,
  isObjectExpression,
  isStringLiteral,
  parseMethodChain,
} from './astUtils.js'
import { parseDefaultValue, parseObjectExpression } from './expressionParser.js'
import type { DrizzleColumnDefinition, DrizzleEnumDefinition } from './types.js'

/**
 * Extract enum definition from inline mysqlEnum call
 */
const extractInlineEnumDefinition = (
  callExpr: Expression,
): DrizzleEnumDefinition | null => {
  if (
    callExpr.type !== 'CallExpression' ||
    callExpr.callee.type !== 'Identifier' ||
    callExpr.callee.value !== 'mysqlEnum' ||
    callExpr.arguments.length < 2
  ) {
    return null
  }

  const enumNameArg = callExpr.arguments[0]
  const valuesArg = callExpr.arguments[1]

  if (!enumNameArg || !valuesArg) return null

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

/**
 * Parse runtime function from $defaultFn or $onUpdate arguments
 */
const parseRuntimeFunction = (args: Argument[]): string => {
  if (args.length === 0) {
    return 'custom_function()'
  }

  const argExpr = getArgumentExpression(args[0])
  if (!argExpr || argExpr.type !== 'ArrowFunctionExpression') {
    return 'custom_function()'
  }

  const body = argExpr.body
  if (body.type === 'CallExpression' && body.callee.type === 'Identifier') {
    return `${body.callee.value}()`
  }
  if (body.type === 'NewExpression' && body.callee.type === 'Identifier') {
    return `new ${body.callee.value}()`
  }

  return 'custom_function()'
}

/**
 * Parse column definition from object property and extract any inline enum definitions
 */
export const parseColumnFromProperty = (
  prop: Property,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleColumnDefinition | null => {
  if (prop.type !== 'KeyValueProperty') return null

  const columnName =
    prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
  if (!columnName) return null

  if (prop.value.type !== 'CallExpression') return null

  // Parse the method chain to find the base type
  const methods = parseMethodChain(prop.value)

  // Find the base type from the root of the chain
  let baseType: string | null = null
  let current: Expression = prop.value

  // Traverse to the bottom of the method chain to find the base type call
  while (
    current.type === 'CallExpression' &&
    current.callee.type === 'MemberExpression'
  ) {
    current = current.callee.object
  }

  if (
    current.type === 'CallExpression' &&
    current.callee.type === 'Identifier'
  ) {
    baseType = current.callee.value

    if (baseType === 'mysqlEnum' && extractedEnums) {
      const enumDef = extractInlineEnumDefinition(current)
      if (enumDef) {
        extractedEnums[enumDef.name] = enumDef
      }
    }
  }

  if (!baseType) return null

  // Extract the actual column name from the first argument of the base type call
  let actualColumnName = columnName // Default to JS property name
  if (current.type === 'CallExpression' && current.arguments.length > 0) {
    const firstArg = current.arguments[0]
    const firstArgExpr = getArgumentExpression(firstArg)
    if (firstArgExpr && isStringLiteral(firstArgExpr)) {
      actualColumnName = firstArgExpr.value
    }
  }

  const column: DrizzleColumnDefinition = {
    name: actualColumnName,
    type: baseType,
    notNull: false,
    primaryKey: false,
    unique: false,
  }

  // Parse type options from second argument (like { length: 255 })
  if (current.type === 'CallExpression' && current.arguments.length > 1) {
    const secondArg = current.arguments[1]
    const secondArgExpr = getArgumentExpression(secondArg)
    if (secondArgExpr && isObjectExpression(secondArgExpr)) {
      column.typeOptions = parseObjectExpression(secondArgExpr)
    }
  }

  // Parse method calls in the chain (already parsed above)
  for (const method of methods) {
    switch (method.name) {
      case 'primaryKey':
        column.primaryKey = true
        column.notNull = true
        break
      case 'autoincrement':
        // MySQL specific: int().autoincrement()
        break
      case 'notNull':
        column.notNull = true
        break
      case 'unique':
        column.unique = true
        break
      case 'default':
        if (method.args.length > 0) {
          const argExpr = getArgumentExpression(method.args[0])
          if (argExpr) {
            column.default = parseDefaultValue(argExpr)
          }
        }
        break
      case 'defaultNow':
        column.default = 'now()'
        break
      case '$defaultFn':
        column.default = parseRuntimeFunction(method.args)
        break
      case '$onUpdate':
        column.onUpdate = parseRuntimeFunction(method.args)
        break
      case 'onUpdateNow':
        // MySQL specific: ON UPDATE NOW() - ignore for now
        break
      case '$type':
        // Type assertion - ignore for parsing purposes
        break
      case 'references':
        if (method.args.length > 0) {
          const argExpr = getArgumentExpression(method.args[0])
          // Parse references: () => table.column
          if (argExpr && argExpr.type === 'ArrowFunctionExpression') {
            const body = argExpr.body
            if (
              body.type === 'MemberExpression' &&
              body.object.type === 'Identifier' &&
              body.property.type === 'Identifier'
            ) {
              const referencesOptions: {
                table: string
                column: string
                onDelete?: string
                onUpdate?: string
              } = {
                table: body.object.value,
                column: body.property.value,
              }

              // Parse the second argument for onDelete/onUpdate options
              if (method.args.length > 1) {
                const optionsExpr = getArgumentExpression(method.args[1])
                if (optionsExpr && isObjectExpression(optionsExpr)) {
                  const options = parseObjectExpression(optionsExpr)
                  if (typeof options['onDelete'] === 'string') {
                    referencesOptions.onDelete = options['onDelete']
                  }
                  if (typeof options['onUpdate'] === 'string') {
                    referencesOptions.onUpdate = options['onUpdate']
                  }
                }
              }

              column.references = referencesOptions
            }
          }
        }
        break
      case '$comment':
        if (method.args.length > 0) {
          const argExpr = getArgumentExpression(method.args[0])
          const commentValue = argExpr ? getStringValue(argExpr) : null
          if (commentValue) {
            column.comment = commentValue
          }
        }
        break
    }
  }

  // Handle autoincrement for primary key columns
  const hasAutoincrementMethod = methods.some((m) => m.name === 'autoincrement')
  if (
    column.primaryKey &&
    ((baseType === 'int' && hasAutoincrementMethod) || baseType === 'serial')
  ) {
    column.default = 'autoincrement()'
  }

  return column
}
