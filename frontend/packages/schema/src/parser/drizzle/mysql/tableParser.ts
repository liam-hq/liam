/**
 * MySQL-specific table structure parsing for Drizzle ORM schema parsing
 */

import type { CallExpression, Expression, Property } from '@swc/core'
import type { Constraint } from '../../../schema/index.js'
import { getArgumentExpression, isStringLiteral } from '../shared/astUtils.js'
import { BaseDrizzleTableParser } from '../shared/tableParser.js'
import type { DatabaseSpecificConfig } from '../shared/types.js'
import { isMysqlTableCall } from './astUtils.js'
import { parseColumnFromProperty } from './columnParser.js'
import { MySQLTypeConverter } from './typeConverter.js'
import type {
  CompositePrimaryKeyDefinition,
  DrizzleCheckConstraintDefinition,
  DrizzleColumnDefinition,
  DrizzleEnumDefinition,
  DrizzleIndexDefinition,
  DrizzleTableDefinition,
} from './types.js'
import { isCompositePrimaryKey, isDrizzleIndex } from './types.js'

class MySQLDrizzleTableParser extends BaseDrizzleTableParser {
  constructor() {
    const config: DatabaseSpecificConfig = {
      typeConverter: new MySQLTypeConverter(),
      supportsInlineEnums: true,
      supportsCheckConstraints: true,
      supportsMySQLSpecificMethods: true,
    }
    super(config)
  }

  override parseColumnFromProperty(
    prop: Property,
    extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleColumnDefinition | null {
    return parseColumnFromProperty(prop, extractedEnums)
  }

  override isTableCall(callExpr: CallExpression): boolean {
    return isMysqlTableCall(callExpr)
  }

  protected override isCompositePrimaryKey(
    indexDef: unknown,
  ): indexDef is CompositePrimaryKeyDefinition {
    return isCompositePrimaryKey(indexDef)
  }

  protected override isDrizzleIndex(
    indexDef: unknown,
  ): indexDef is DrizzleIndexDefinition {
    return isDrizzleIndex(indexDef)
  }

  override parseTableWithComment(
    commentCallExpr: CallExpression,
    extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleTableDefinition | null {
    // Extract the comment from the call arguments
    let comment: string | null = null
    if (commentCallExpr.arguments.length > 0) {
      const commentArg = commentCallExpr.arguments[0]
      const commentExpr = getArgumentExpression(commentArg)
      if (commentExpr && isStringLiteral(commentExpr)) {
        comment = commentExpr.value
      }
    }

    // Get the mysqlTable call from the object of the member expression
    if (commentCallExpr.callee.type === 'MemberExpression') {
      const mysqlTableCall = commentCallExpr.callee.object
      if (
        mysqlTableCall.type === 'CallExpression' &&
        this.isTableCall(mysqlTableCall)
      ) {
        const table = this.parseTableCall(mysqlTableCall, extractedEnums)
        if (table && comment) {
          table.comment = comment
        }
        return table
      }
    }

    return null
  }

  protected override parseCustomConstraints(
    callExpr: CallExpression,
    name: string,
    tableColumns: Record<string, DrizzleColumnDefinition>,
  ): Record<string, Constraint> | null {
    const constraints: Record<string, Constraint> = {}

    // Handle check constraints
    const checkConstraint = parseCheckConstraint(callExpr, name)
    if (checkConstraint) {
      constraints[checkConstraint.name] = {
        type: 'CHECK',
        name: checkConstraint.name,
        detail: checkConstraint.condition,
      }
    }

    // Handle unique constraints
    const uniqueConstraint = parseUniqueConstraint(callExpr, name, tableColumns)
    if (uniqueConstraint) {
      constraints[uniqueConstraint.name] = {
        type: 'UNIQUE',
        name: uniqueConstraint.name,
        columnNames: uniqueConstraint.columnNames,
      }
    }

    return Object.keys(constraints).length > 0 ? constraints : null
  }
}

const mysqlTableParser = new MySQLDrizzleTableParser()

/**
 * Parse mysqlTable call with comment method chain and extract any inline enum definitions
 */
export const parseMysqlTableWithComment = (
  commentCallExpr: CallExpression,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleTableDefinition | null => {
  // Extract the comment from the call arguments
  let comment: string | null = null
  if (commentCallExpr.arguments.length > 0) {
    const commentArg = commentCallExpr.arguments[0]
    const commentExpr = getArgumentExpression(commentArg)
    if (commentExpr && isStringLiteral(commentExpr)) {
      comment = commentExpr.value
    }
  }

  // Get the mysqlTable call from the object of the member expression
  if (commentCallExpr.callee.type === 'MemberExpression') {
    const mysqlTableCall = commentCallExpr.callee.object
    if (
      mysqlTableCall.type === 'CallExpression' &&
      isMysqlTableCall(mysqlTableCall)
    ) {
      const table = mysqlTableParser.parseTableCall(
        mysqlTableCall,
        extractedEnums,
      )
      if (table && comment) {
        table.comment = comment
      }
      return table
    }
  }

  return null
}

/**
 * Parse mysqlTable call expression and extract any inline enum definitions
 */
export const parseMysqlTableCall = (
  callExpr: CallExpression,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleTableDefinition | null => {
  return mysqlTableParser.parseTableCall(callExpr, extractedEnums)
}

/**
 * Parse schema.table() call expression and extract any inline enum definitions
 */
export const parseSchemaTableCall = (
  callExpr: CallExpression,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleTableDefinition | null => {
  return mysqlTableParser.parseSchemaTableCall(callExpr, extractedEnums)
}

/**
 * Parse check constraint definition
 */
const parseCheckConstraint = (
  callExpr: CallExpression,
  name: string,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
): DrizzleCheckConstraintDefinition | null => {
  // Handle check('constraint_name', sql`condition`)
  if (
    callExpr.callee.type === 'Identifier' &&
    callExpr.callee.value === 'check'
  ) {
    // Extract the constraint name from the first argument
    let constraintName = name
    if (callExpr.arguments.length > 0) {
      const nameArg = callExpr.arguments[0]
      const nameExpr = getArgumentExpression(nameArg)
      if (nameExpr && isStringLiteral(nameExpr)) {
        constraintName = nameExpr.value
      }
    }

    // Extract the condition from the second argument (sql template literal)
    let condition = 'true' // Default condition
    if (callExpr.arguments.length > 1) {
      const conditionArg = callExpr.arguments[1]
      const conditionExpr = getArgumentExpression(conditionArg)

      if (conditionExpr) {
        // Handle sql`condition` template literal
        if (
          conditionExpr.type === 'TaggedTemplateExpression' &&
          conditionExpr.tag.type === 'Identifier' &&
          conditionExpr.tag.value === 'sql'
        ) {
          // Extract the condition from template literal
          if (
            conditionExpr.template.type === 'TemplateLiteral' &&
            conditionExpr.template.quasis.length > 0
          ) {
            const firstQuasi = conditionExpr.template.quasis[0]
            if (firstQuasi && firstQuasi.type === 'TemplateElement') {
              // SWC TemplateElement has different structure than TypeScript's
              // We need to access the raw string from the SWC AST structure
              // Use property access with type checking to avoid type assertions
              const hasRaw =
                'raw' in firstQuasi && typeof firstQuasi.raw === 'string'
              const hasCooked =
                'cooked' in firstQuasi && typeof firstQuasi.cooked === 'string'

              if (hasRaw) {
                condition = firstQuasi.raw || ''
              } else if (hasCooked) {
                condition = firstQuasi.cooked || ''
              }
            }
          }
        }
        // Handle direct function call like sql('condition')
        else if (
          conditionExpr.type === 'CallExpression' &&
          conditionExpr.callee.type === 'Identifier' &&
          conditionExpr.callee.value === 'sql' &&
          conditionExpr.arguments.length > 0
        ) {
          const sqlArg = getArgumentExpression(conditionExpr.arguments[0])
          if (sqlArg && isStringLiteral(sqlArg)) {
            condition = sqlArg.value
          }
        }
      }
    }

    return {
      type: 'check',
      name: constraintName,
      condition,
    }
  }

  return null
}

/**
 * Parse unique constraint definition
 */
const parseUniqueConstraint = (
  callExpr: CallExpression,
  name: string,
  tableColumns: Record<string, DrizzleColumnDefinition>,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
): { type: 'UNIQUE'; name: string; columnNames: string[] } | null => {
  // Handle unique('constraint_name').on(...) method chain
  let constraintName = name
  let currentExpr: Expression = callExpr
  const columns: string[] = []

  // First check if we have a method chain ending with .on(...)
  const methodCalls: Array<{ method: string; expr: CallExpression }> = []

  // Traverse method chain to collect all calls
  while (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'MemberExpression' &&
    currentExpr.callee.property.type === 'Identifier'
  ) {
    const methodName = currentExpr.callee.property.value
    methodCalls.unshift({ method: methodName, expr: currentExpr })
    currentExpr = currentExpr.callee.object
  }

  // The base should be unique()
  if (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'Identifier' &&
    currentExpr.callee.value === 'unique'
  ) {
    // Get the constraint name from the first argument
    if (currentExpr.arguments.length > 0) {
      const nameArg = currentExpr.arguments[0]
      const nameExpr = getArgumentExpression(nameArg)
      if (nameExpr && isStringLiteral(nameExpr)) {
        constraintName = nameExpr.value
      }
    }

    // Find the .on() method call and parse columns
    for (const { method, expr } of methodCalls) {
      if (method === 'on') {
        // Parse column references from .on(...) arguments
        for (const arg of expr.arguments) {
          const argExpr = getArgumentExpression(arg)
          if (
            argExpr &&
            argExpr.type === 'MemberExpression' &&
            argExpr.object.type === 'Identifier' &&
            argExpr.property.type === 'Identifier'
          ) {
            // Get the JavaScript property name
            const jsPropertyName = argExpr.property.value
            // Find the actual database column name from the table columns
            const column = tableColumns[jsPropertyName]
            if (column) {
              columns.push(column.name) // Use database column name
            } else {
              columns.push(jsPropertyName) // Fallback to JS property name
            }
          }
        }
        break
      }
    }

    if (columns.length > 0) {
      return {
        type: 'UNIQUE',
        name: constraintName,
        columnNames: columns,
      }
    }
  }

  return null
}
