/**
 * Main orchestrator for Drizzle ORM schema parsing
 */

import type { CallExpression, Module, VariableDeclarator } from '@swc/core'
import { parseSync } from '@swc/core'
import type { Processor, ProcessResult } from '../../types.js'
import { extractSqliteTableFromChain } from './astUtils.js'
import { convertDrizzleTablesToInternal } from './converter.js'
import {
  parseSqliteTableCall,
  parseSqliteTableWithComment,
} from './tableParser.js'
import type { DrizzleTableDefinition } from './types.js'

/**
 * Parse Drizzle TypeScript schema to extract table definitions using SWC AST
 */
const parseDrizzleSchema = (
  sourceCode: string,
): {
  tables: Record<string, DrizzleTableDefinition>
  variableToTableMapping: Record<string, string>
} => {
  // Parse TypeScript code into AST
  const ast = parseSync(sourceCode, {
    syntax: 'typescript',
    target: 'es2022',
  })

  const tables: Record<string, DrizzleTableDefinition> = {}
  const variableToTableMapping: Record<string, string> = {}

  // Traverse the AST to find sqliteTable calls
  visitModule(ast, tables, variableToTableMapping)

  return { tables, variableToTableMapping }
}

/**
 * Visit and traverse the module AST
 */
const visitModule = (
  module: Module,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  for (const item of module.body) {
    if (item.type === 'VariableDeclaration') {
      for (const declarator of item.declarations) {
        visitVariableDeclarator(declarator, tables, variableToTableMapping)
      }
    } else if (
      item.type === 'ExportDeclaration' &&
      item.declaration?.type === 'VariableDeclaration'
    ) {
      for (const declarator of item.declaration.declarations) {
        visitVariableDeclarator(declarator, tables, variableToTableMapping)
      }
    }
  }
}

/**
 * Check if the call expression is a comment call
 */
const isCommentCall = (callExpr: CallExpression): boolean => {
  return (
    callExpr.type === 'CallExpression' &&
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.property.type === 'Identifier' &&
    callExpr.callee.property.value === '$comment'
  )
}

/**
 * Handle comment calls
 */
const handleCommentCall = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  if (declarator.init?.type !== 'CallExpression') return

  const table = parseSqliteTableWithComment(declarator.init)
  if (table && declarator.id.type === 'Identifier') {
    tables[table.name] = table
    variableToTableMapping[declarator.id.value] = table.name
  }
}

/**
 * Handle sqliteTable calls (direct or method chained)
 */
const handleSqliteTableCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  const baseSqliteTableCall = extractSqliteTableFromChain(callExpr)
  if (baseSqliteTableCall) {
    const table = parseSqliteTableCall(baseSqliteTableCall)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      variableToTableMapping[declarator.id.value] = table.name
    }
  }
}

/**
 * Visit variable declarator to find sqliteTable calls
 */
const visitVariableDeclarator = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  if (!declarator.init || declarator.init.type !== 'CallExpression') {
    return
  }

  const callExpr = declarator.init

  if (isCommentCall(callExpr)) {
    handleCommentCall(declarator, tables, variableToTableMapping)
  } else {
    handleSqliteTableCall(declarator, callExpr, tables, variableToTableMapping)
  }
}

/**
 * Main processor function for Drizzle schemas
 */
const parseDrizzleSchemaString = (
  schemaString: string,
): Promise<ProcessResult> => {
  try {
    const { tables: drizzleTables, variableToTableMapping } =
      parseDrizzleSchema(schemaString)
    const { tables, errors } = convertDrizzleTablesToInternal(
      drizzleTables,
      variableToTableMapping,
    )

    // SQLite has no native enum type, so enums are always empty
    return Promise.resolve({
      value: { tables, enums: {}, extensions: {} },
      errors,
    })
  } catch (error) {
    return Promise.resolve({
      value: { tables: {}, enums: {}, extensions: {} },
      errors: [
        new Error(
          `Error parsing Drizzle schema: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    })
  }
}

export const processor: Processor = parseDrizzleSchemaString
