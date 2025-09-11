/**
 * Shared table parsing logic for Drizzle parsers
 */

import type {
  CallExpression,
  Expression,
  ObjectExpression,
  Property,
} from '@swc/core'
import type { Constraint } from '../../../schema/index.js'
import {
  getArgumentExpression,
  getIdentifierName,
  getStringValue,
  isObjectExpression,
  isSchemaTableCall,
} from './astUtils.js'
import { parseIndexDefinition } from './indexParser.js'
import type { DatabaseSpecificConfig } from './types.js'

type DrizzleColumnDefinition = {
  name: string
  type: string
  notNull: boolean
  primaryKey: boolean
  unique: boolean
  default?: unknown
  comment?: string | undefined
  typeOptions?: Record<string, unknown>
  references?:
    | {
        table: string
        column: string
        onUpdate?: string | undefined
        onDelete?: string | undefined
      }
    | undefined
  onUpdate?: unknown
}

type DrizzleEnumDefinition = {
  name: string
  values: string[]
}

type DrizzleIndexDefinition = {
  type?: string
  name: string
  columns: string[]
  unique: boolean
}

type CompositePrimaryKeyDefinition = {
  type: 'primaryKey'
  columns: string[]
}

type DrizzleTableDefinition = {
  name: string
  columns: Record<string, DrizzleColumnDefinition>
  indexes: Record<string, DrizzleIndexDefinition>
  constraints?: Record<string, Constraint>
  compositePrimaryKey?: CompositePrimaryKeyDefinition
  comment?: string | undefined
  schemaName?: string
}

export class BaseDrizzleTableParser {
  protected config: DatabaseSpecificConfig

  constructor(config: DatabaseSpecificConfig) {
    this.config = config
  }

  parseColumnFromProperty(
    _prop: Property,
    _extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleColumnDefinition | null {
    return null
  }

  isTableCall(_callExpr: CallExpression): boolean {
    return false
  }

  parseTableWithComment(
    _commentCallExpr: CallExpression,
    _extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleTableDefinition | null {
    return null
  }

  /**
   * Parse columns from object expression and extract any inline enum definitions
   */
  protected parseTableColumns(
    columnsExpr: ObjectExpression,
    extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): Record<string, DrizzleColumnDefinition> {
    const columns: Record<string, DrizzleColumnDefinition> = {}

    for (const prop of columnsExpr.properties) {
      if (prop.type === 'KeyValueProperty') {
        const column = this.parseColumnFromProperty(prop, extractedEnums)
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
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Consolidated logic from MySQL/PostgreSQL parsers
  protected parseTableExtensions(
    thirdArgExpr: Expression,
    tableColumns: Record<string, DrizzleColumnDefinition>,
  ): {
    indexes: Record<string, DrizzleIndexDefinition>
    constraints?: Record<string, Constraint>
    compositePrimaryKey?: CompositePrimaryKeyDefinition
  } {
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
              prop.key.type === 'Identifier'
                ? getIdentifierName(prop.key)
                : null
            if (indexName && prop.value.type === 'CallExpression') {
              const indexDef = parseIndexDefinition(prop.value, indexName)
              if (indexDef) {
                if (this.isCompositePrimaryKey(indexDef)) {
                  result.compositePrimaryKey = indexDef
                } else if (this.isDrizzleIndex(indexDef)) {
                  result.indexes[indexName] = indexDef
                }
              }

              const constraints = this.parseCustomConstraints?.(
                prop.value,
                indexName,
                tableColumns,
              )
              if (constraints) {
                result.constraints = result.constraints || {}
                Object.assign(result.constraints, constraints)
              }
            }
          }
        }
      }
    }

    return result
  }

  /**
   * Parse table call expression
   */
  parseTableCall(
    callExpr: CallExpression,
    extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleTableDefinition | null {
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
    table.columns = this.parseTableColumns(columnsExpr, extractedEnums)

    // Parse indexes and composite primary key from third argument if present
    if (callExpr.arguments.length > 2) {
      const thirdArg = callExpr.arguments[2]
      const thirdArgExpr = getArgumentExpression(thirdArg)
      if (thirdArgExpr) {
        const extensions = this.parseTableExtensions(
          thirdArgExpr,
          table.columns,
        )
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
   * Parse schema.table() call expression
   */
  parseSchemaTableCall(
    callExpr: CallExpression,
    extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleTableDefinition | null {
    if (!isSchemaTableCall(callExpr) || callExpr.arguments.length < 2)
      return null

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

    // Parse columns from the object expression and extract any inline enum definitions
    table.columns = this.parseTableColumns(columnsExpr, extractedEnums)

    // Parse indexes and composite primary key from third argument if present
    if (callExpr.arguments.length > 2) {
      const thirdArg = callExpr.arguments[2]
      const thirdArgExpr = getArgumentExpression(thirdArg)
      if (thirdArgExpr) {
        const extensions = this.parseTableExtensions(
          thirdArgExpr,
          table.columns,
        )
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

  protected isCompositePrimaryKey(
    indexDef: unknown,
  ): indexDef is CompositePrimaryKeyDefinition {
    return (
      indexDef !== null &&
      typeof indexDef === 'object' &&
      'type' in indexDef &&
      indexDef.type === 'primaryKey' &&
      'columns' in indexDef &&
      Array.isArray(indexDef.columns)
    )
  }

  protected isDrizzleIndex(
    indexDef: unknown,
  ): indexDef is DrizzleIndexDefinition {
    return (
      indexDef !== null &&
      typeof indexDef === 'object' &&
      'name' in indexDef &&
      typeof indexDef.name === 'string' &&
      'columns' in indexDef &&
      Array.isArray(indexDef.columns) &&
      'unique' in indexDef &&
      typeof indexDef.unique === 'boolean'
    )
  }

  protected parseCustomConstraints(
    _callExpr: CallExpression,
    _name: string,
    _tableColumns: Record<string, DrizzleColumnDefinition>,
  ): Record<string, Constraint> | null {
    return null
  }
}
