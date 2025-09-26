/**
 * Main orchestrator for Drizzle ORM schema parsing
 */

import type { CallExpression, Module, VariableDeclarator } from '@swc/core'
import { parseSync } from '@swc/core'
import type { Processor, ProcessResult } from '../../types.js'
import { extractPgTableFromChain, isSchemaTableCall } from './astUtils.js'
import {
  convertDrizzleEnumsToInternal,
  convertDrizzleTablesToInternal,
} from './converter.js'
import { parsePgEnumCall } from './enumParser.js'
import {
  parsePgTableCall,
  parsePgTableWithComment,
  parseSchemaTableCall,
} from './tableParser.js'
import type { DrizzleEnumDefinition, DrizzleTableDefinition } from './types.js'

/**
 * Parse Drizzle TypeScript schema to extract table definitions using SWC AST
 */
const parseDrizzleSchema = (
  sourceCode: string,
): {
  tables: Record<string, DrizzleTableDefinition>
  enums: Record<string, DrizzleEnumDefinition>
  variableToTableMapping: Record<string, string>
} => {
  // Parse TypeScript code into AST
  const ast = parseSync(sourceCode, {
    syntax: 'typescript',
    target: 'es2022',
  })

  const tables: Record<string, DrizzleTableDefinition> = {}
  const enums: Record<string, DrizzleEnumDefinition> = {}
  const variableToTableMapping: Record<string, string> = {}

  // Traverse the AST to find pgTable calls
  visitModule(ast, tables, enums, variableToTableMapping)

  return { tables, enums, variableToTableMapping }
}

/**
 * Visit and traverse the module AST
 */
const visitModule = (
  module: Module,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  for (const item of module.body) {
    if (item.type === 'VariableDeclaration') {
      for (const declarator of item.declarations) {
        visitVariableDeclarator(
          declarator,
          tables,
          enums,
          variableToTableMapping,
        )
      }
    } else if (
      item.type === 'ExportDeclaration' &&
      item.declaration?.type === 'VariableDeclaration'
    ) {
      for (const declarator of item.declaration.declarations) {
        visitVariableDeclarator(
          declarator,
          tables,
          enums,
          variableToTableMapping,
        )
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
 * Check if the call expression is a pgEnum call
 */
const isPgEnumCall = (callExpr: CallExpression): boolean => {
  return (
    callExpr.callee.type === 'Identifier' && callExpr.callee.value === 'pgEnum'
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

  const table = parsePgTableWithComment(declarator.init)
  if (table && declarator.id.type === 'Identifier') {
    tables[table.name] = table
    variableToTableMapping[declarator.id.value] = table.name
  }
}

/**
 * Handle schema table calls
 */
const handleSchemaTableCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  const table = parseSchemaTableCall(callExpr)
  if (table && declarator.id.type === 'Identifier') {
    tables[table.name] = table
    variableToTableMapping[declarator.id.value] = table.name
  }
}

/**
 * Handle pgEnum calls
 */
const handlePgEnumCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  enums: Record<string, DrizzleEnumDefinition>,
) => {
  const enumDef = parsePgEnumCall(callExpr)
  if (enumDef && declarator.id.type === 'Identifier') {
    // Store enum by its actual name (e.g., 'user_role')
    enums[enumDef.name] = enumDef
    // Also store by variable name (e.g., 'userRoleEnum') for lookup
    enums[declarator.id.value] = enumDef
  }
}

/**
 * Handle pgTable calls (direct or method chained)
 */
const handlePgTableCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  const basePgTableCall = extractPgTableFromChain(callExpr)
  if (basePgTableCall) {
    const table = parsePgTableCall(basePgTableCall)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      variableToTableMapping[declarator.id.value] = table.name
    }
  }
}

/**
 * Visit variable declarator to find pgTable, pgEnum, or relations calls
 */
const visitVariableDeclarator = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  if (!declarator.init || declarator.init.type !== 'CallExpression') {
    return
  }

  const callExpr = declarator.init

  // Handle different types of call expressions
  if (isCommentCall(declarator.init)) {
    handleCommentCall(declarator, tables, variableToTableMapping)
  } else if (isSchemaTableCall(callExpr)) {
    handleSchemaTableCall(declarator, callExpr, tables, variableToTableMapping)
  } else if (isPgEnumCall(callExpr)) {
    handlePgEnumCall(declarator, callExpr, enums)
  } else {
    handlePgTableCall(declarator, callExpr, tables, variableToTableMapping)
  }
}

/**
 * Main processor function for Drizzle schemas
 */
const parseDrizzleSchemaString = (
  schemaString: string,
): Promise<ProcessResult> => {
  try {
    const {
      tables: drizzleTables,
      enums,
      variableToTableMapping,
    } = parseDrizzleSchema(schemaString)
    const { tables, errors } = convertDrizzleTablesToInternal(
      drizzleTables,
      enums,
      variableToTableMapping,
    )
    const convertedEnums = convertDrizzleEnumsToInternal(enums)

    return Promise.resolve({
      value: { tables, enums: convertedEnums, extensions: {} },
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
