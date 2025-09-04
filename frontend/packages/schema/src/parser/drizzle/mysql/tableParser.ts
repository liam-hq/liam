/**
 * Table structure parsing for Drizzle ORM MySQL schema parsing
 */

import type { CallExpression, Expression, ObjectExpression } from '@swc/core'
import type { Constraint } from '../../../schema/index.js'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isMysqlTableCall,
  isObjectExpression,
  isSchemaTableCall,
  isStringLiteral,
} from './astUtils.js'
import { parseColumnFromProperty } from './columnParser.js'
import { parseObjectExpression } from './expressionParser.js'
import type {
  CompositePrimaryKeyDefinition,
  DrizzleCheckConstraintDefinition,
  DrizzleColumnDefinition,
  DrizzleEnumDefinition,
  DrizzleIndexDefinition,
  DrizzleTableDefinition,
} from './types.js'
import { isCompositePrimaryKey, isDrizzleIndex } from './types.js'

/**
 * Parse columns from object expression and extract any inline enum definitions
 */
const parseTableColumns = (
  columnsExpr: ObjectExpression,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): Record<string, DrizzleColumnDefinition> => {
  const columns: Record<string, DrizzleColumnDefinition> = {}

  for (const prop of columnsExpr.properties) {
    if (prop.type === 'KeyValueProperty') {
      const column = parseColumnFromProperty(prop, extractedEnums)
      if (column) {
        // Use the JS property name as the key
        const jsPropertyName =
          prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
        if (jsPropertyName) {
          columns[jsPropertyName] = column
        }
      }
    }
  }

  return columns
}

/**
 * Parse indexes, constraints, and composite primary keys from third argument
 */
const parseTableExtensions = (
  thirdArgExpr: Expression,
  tableColumns: Record<string, DrizzleColumnDefinition>,
): {
  indexes: Record<string, DrizzleIndexDefinition>
  constraints?: Record<string, Constraint>
  compositePrimaryKey?: CompositePrimaryKeyDefinition
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
} => {
  const result: {
    indexes: Record<string, DrizzleIndexDefinition>
    constraints?: Record<string, Constraint>
    compositePrimaryKey?: CompositePrimaryKeyDefinition
  } = {
    indexes: {},
  }

  if (thirdArgExpr.type === 'ArrowFunctionExpression') {
    // Parse arrow function like (table) => ({ nameIdx: index(...), pk: primaryKey(...) })
    let returnExpr = thirdArgExpr.body

    // Handle parenthesized expressions like (table) => ({ ... })
    if (returnExpr.type === 'ParenthesisExpression') {
      returnExpr = returnExpr.expression
    }

    if (returnExpr.type === 'ObjectExpression') {
      for (const prop of returnExpr.properties) {
        if (prop.type === 'KeyValueProperty') {
          const indexName =
            prop.key.type === 'Identifier' ? getIdentifierName(prop.key) : null
          if (indexName && prop.value.type === 'CallExpression') {
            const indexDef = parseIndexDefinition(prop.value, indexName)
            if (indexDef) {
              if (isCompositePrimaryKey(indexDef)) {
                result.compositePrimaryKey = indexDef
              } else if (isDrizzleIndex(indexDef)) {
                result.indexes[indexName] = indexDef
              }
            }

            // Handle check constraints
            const checkConstraint = parseCheckConstraint(prop.value, indexName)
            if (checkConstraint) {
              result.constraints = result.constraints || {}
              result.constraints[checkConstraint.name] = {
                type: 'CHECK',
                name: checkConstraint.name,
                detail: checkConstraint.condition,
              }
            }

            // Handle unique constraints
            const uniqueConstraint = parseUniqueConstraint(
              prop.value,
              indexName,
              tableColumns,
            )
            if (uniqueConstraint) {
              result.constraints = result.constraints || {}
              result.constraints[uniqueConstraint.name] = {
                type: 'UNIQUE',
                name: uniqueConstraint.name,
                columnNames: uniqueConstraint.columnNames,
              }
            }
          }
        }
      }
    }
  }

  return result
}

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
      const table = parseMysqlTableCall(mysqlTableCall, extractedEnums)
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
  if (callExpr.arguments.length < 2) return null

  const tableNameArg = callExpr.arguments[0]
  const columnsArg = callExpr.arguments[1]

  if (!tableNameArg || !columnsArg) return null

  // Extract expression from SWC argument structure
  const tableNameExpr = getArgumentExpression(tableNameArg)
  const columnsExpr = getArgumentExpression(columnsArg)

  const tableName = tableNameExpr ? getStringValue(tableNameExpr) : null
  if (!tableName || !columnsExpr || !isObjectExpression(columnsExpr))
    return null

  const table: DrizzleTableDefinition = {
    name: tableName,
    columns: {},
    indexes: {},
  }

  // Parse columns from the object expression and extract any inline enum definitions
  table.columns = parseTableColumns(columnsExpr, extractedEnums)

  // Parse indexes and composite primary key from third argument if present
  if (callExpr.arguments.length > 2) {
    const thirdArg = callExpr.arguments[2]
    const thirdArgExpr = getArgumentExpression(thirdArg)
    if (thirdArgExpr) {
      const extensions = parseTableExtensions(thirdArgExpr, table.columns)
      table.indexes = extensions.indexes
      if (extensions.constraints) {
        table.constraints = extensions.constraints
      }
      if (extensions.compositePrimaryKey) {
        table.compositePrimaryKey = extensions.compositePrimaryKey
      }
    }
  }

  return table
}

/**
 * Parse schema.table() call expression and extract any inline enum definitions
 */
export const parseSchemaTableCall = (
  callExpr: CallExpression,
  extractedEnums?: Record<string, DrizzleEnumDefinition>,
): DrizzleTableDefinition | null => {
  if (!isSchemaTableCall(callExpr) || callExpr.arguments.length < 2) return null

  // Extract expression from SWC argument structure
  const tableNameExpr = getArgumentExpression(callExpr.arguments[0])
  const columnsExpr = getArgumentExpression(callExpr.arguments[1])

  const tableName = tableNameExpr ? getStringValue(tableNameExpr) : null
  if (!tableName || !columnsExpr || !isObjectExpression(columnsExpr))
    return null

  // Extract schema name from the member expression (e.g., authSchema.table -> authSchema)
  let schemaName = ''
  if (
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.object.type === 'Identifier'
  ) {
    schemaName = callExpr.callee.object.value
  }

  const table: DrizzleTableDefinition = {
    name: tableName, // Keep the original table name for DB operations
    columns: {},
    indexes: {},
    schemaName, // Add schema information for namespace handling
  }

  // Note: We now handle schema namespace by storing the schema name
  // and using the original table name for database operations

  // Parse columns from the object expression and extract any inline enum definitions
  table.columns = parseTableColumns(columnsExpr, extractedEnums)

  // Parse indexes and composite primary key from third argument if present
  if (callExpr.arguments.length > 2) {
    const thirdArg = callExpr.arguments[2]
    const thirdArgExpr = getArgumentExpression(thirdArg)
    if (thirdArgExpr) {
      const extensions = parseTableExtensions(thirdArgExpr, table.columns)
      table.indexes = extensions.indexes
      if (extensions.constraints) {
        table.constraints = extensions.constraints
      }
      if (extensions.compositePrimaryKey) {
        table.compositePrimaryKey = extensions.compositePrimaryKey
      }
    }
  }

  return table
}

/**
 * Parse index or primary key definition
 */
const parseIndexDefinition = (
  callExpr: CallExpression,
  name: string,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
): DrizzleIndexDefinition | CompositePrimaryKeyDefinition | null => {
  // Handle primaryKey({ columns: [...] })
  if (
    callExpr.callee.type === 'Identifier' &&
    callExpr.callee.value === 'primaryKey'
  ) {
    if (callExpr.arguments.length > 0) {
      const configArg = callExpr.arguments[0]
      const configExpr = getArgumentExpression(configArg)
      if (configExpr && isObjectExpression(configExpr)) {
        const config = parseObjectExpression(configExpr)
        if (config['columns'] && Array.isArray(config['columns'])) {
          const columns = config['columns'].filter(
            (col): col is string => typeof col === 'string',
          )
          return {
            type: 'primaryKey',
            columns,
          }
        }
      }
    }
    return null
  }

  // Handle index('name').on(...) or uniqueIndex('name').on(...) with optional .using(...)
  let isUnique = false
  let indexName = name
  let indexType = '' // Index type (btree, hash, etc.)
  let currentExpr: Expression = callExpr

  // Traverse the method chain to find index(), on(), and using() calls
  const methodCalls: Array<{ method: string; expr: CallExpression }> = []

  while (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'MemberExpression' &&
    currentExpr.callee.property.type === 'Identifier'
  ) {
    const methodName = currentExpr.callee.property.value
    methodCalls.unshift({ method: methodName, expr: currentExpr })
    currentExpr = currentExpr.callee.object
  }

  // The base should be index() or uniqueIndex()
  if (
    currentExpr.type === 'CallExpression' &&
    currentExpr.callee.type === 'Identifier'
  ) {
    const baseMethod = currentExpr.callee.value
    if (baseMethod === 'index' || baseMethod === 'uniqueIndex') {
      isUnique = baseMethod === 'uniqueIndex'
      // Get the index name from the first argument
      if (currentExpr.arguments.length > 0) {
        const nameArg = currentExpr.arguments[0]
        const nameExpr = getArgumentExpression(nameArg)
        if (nameExpr && isStringLiteral(nameExpr)) {
          indexName = nameExpr.value
        }
      }
    }
  }

  // Parse method chain to extract columns and index type
  const columns: string[] = []

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
          columns.push(argExpr.property.value)
        }
      }
    } else if (method === 'using') {
      // Parse index type from .using('type') - only the first argument specifies the type
      if (expr.arguments.length > 0) {
        const typeArg = expr.arguments[0]
        const typeExpr = getArgumentExpression(typeArg)
        if (typeExpr && isStringLiteral(typeExpr)) {
          indexType = typeExpr.value
        }
      }
    }
  }

  if (columns.length > 0) {
    return {
      name: indexName,
      columns,
      unique: isUnique,
      type: indexType,
    }
  }

  return null
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
