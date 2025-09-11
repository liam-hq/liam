/**
 * Column definition parsing for Drizzle ORM MySQL schema parsing
 */

import type { Argument, Expression, Property } from '@swc/core'
import {
  getArgumentExpression,
  getStringValue,
  isArrayExpression,
} from '../shared/astUtils.js'
import { BaseDrizzleColumnParser } from '../shared/columnParser.js'
import type { DatabaseSpecificConfig } from '../shared/types.js'
import { MySQLTypeConverter } from './typeConverter.js'
import type { DrizzleColumnDefinition, DrizzleEnumDefinition } from './types.js'

class MySQLDrizzleColumnParser extends BaseDrizzleColumnParser {
  constructor() {
    const config: DatabaseSpecificConfig = {
      typeConverter: new MySQLTypeConverter(),
      supportsInlineEnums: true,
      supportsCheckConstraints: true,
      supportsMySQLSpecificMethods: true,
    }
    super(config)
  }

  override extractInlineEnumDefinition(
    callExpr: Expression,
  ): DrizzleEnumDefinition | null {
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

  protected override parseCustomMethod(
    method: { name: string; args: Argument[] },
    column: DrizzleColumnDefinition,
  ): void {
    switch (method.name) {
      case 'autoincrement':
        // MySQL specific: int().autoincrement()
        break
      case '$defaultFn':
        column.default = this.parseRuntimeFunction(method.args)
        break
      case '$onUpdate':
        column.onUpdate = this.parseRuntimeFunction(method.args)
        break
      case 'onUpdateNow':
        // MySQL specific: ON UPDATE NOW() - ignore for now
        break
      case '$type':
        // Type assertion - ignore for parsing purposes
        break
      case 'defaultRandom':
        // Handle if needed
        break
    }
  }

  protected override handleAutoIncrement(
    column: DrizzleColumnDefinition,
    baseType: string,
    methods: Array<{ name: string; args: Argument[] }>,
  ): void {
    const hasAutoincrementMethod = methods.some(
      (m) => m.name === 'autoincrement',
    )
    if (
      column.primaryKey &&
      ((baseType === 'int' && hasAutoincrementMethod) || baseType === 'serial')
    ) {
      column.default = 'autoincrement()'
    }
  }

  private parseRuntimeFunction(args: Argument[]): string {
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
}

const mysqlColumnParser = new MySQLDrizzleColumnParser()

/**
 * Parse column definition from object property and extract any inline enum definitions
 */
export const parseColumnFromProperty = (
  prop: Property,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleColumnDefinition | null => {
  return mysqlColumnParser.parseColumnFromProperty(prop, extractedEnums)
}
