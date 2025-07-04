/**
 * Main orchestrator for Drizzle ORM schema parsing
 */

import type { Processor, ProcessResult } from '../types.js'
import { isPgTableCall } from './ast-utils.js'
import { convertDrizzleTablesToInternal } from './converter.js'
import { parsePgEnumCall } from './enum-parser.js'
import { parseRelationsCall } from './relation-parser.js'
import { parsePgTableCall, parsePgTableWithComment } from './table-parser.js'
import type {
  DrizzleEnumDefinition,
  DrizzleRelationDefinition,
  DrizzleTableDefinition,
} from './types.js'

/**
 * Parse Drizzle TypeScript schema to extract table definitions using SWC AST
 */
const parseDrizzleSchema = async (
  sourceCode: string,
): Promise<{
  tables: Record<string, DrizzleTableDefinition>
  enums: Record<string, DrizzleEnumDefinition>
  relations: DrizzleRelationDefinition[]
}> => {
  // Only run on server-side (Node.js environment)
  if (typeof window !== 'undefined') {
    throw new Error('Drizzle parsing is only supported on server-side')
  }

  try {
    // Dynamic import of @swc/core to avoid webpack bundling issues
    const { parseSync } = await import('@swc/core')

    // Parse TypeScript code into AST
    const ast = parseSync(sourceCode, {
      syntax: 'typescript',
      target: 'es2022',
    })

    const tables: Record<string, DrizzleTableDefinition> = {}
    const enums: Record<string, DrizzleEnumDefinition> = {}
    const relations: DrizzleRelationDefinition[] = []

    // Traverse the AST to find pgTable calls
    visitModule(ast, tables, enums, relations)

    return { tables, enums, relations }
  } catch (error) {
    console.error('Error parsing Drizzle schema with @swc/core:', error)
    throw new Error(
      `Failed to parse Drizzle schema: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Visit and traverse the module AST
 */
const visitModule = (
  module: unknown,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  relations: DrizzleRelationDefinition[],
) => {
  // Type guard for module with body property
  if (typeof module === 'object' && module !== null && 'body' in module) {
    const moduleBody = (module as { body: unknown[] }).body

    for (const item of moduleBody) {
      if (typeof item === 'object' && item !== null) {
        const moduleItem = item as {
          type: string
          declarations?: unknown[]
          declaration?: { type: string; declarations: unknown[] }
        }

        if (
          moduleItem.type === 'VariableDeclaration' &&
          moduleItem.declarations
        ) {
          for (const declarator of moduleItem.declarations) {
            visitVariableDeclarator(declarator, tables, enums, relations)
          }
        } else if (
          moduleItem.type === 'ExportDeclaration' &&
          moduleItem.declaration?.type === 'VariableDeclaration'
        ) {
          for (const declarator of moduleItem.declaration.declarations) {
            visitVariableDeclarator(declarator, tables, enums, relations)
          }
        }
      }
    }
  }
}

/**
 * Visit variable declarator to find pgTable, pgEnum, or relations calls
 */
const visitVariableDeclarator = (
  declarator: unknown,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  relations: DrizzleRelationDefinition[],
) => {
  // Type guard for declarator structure
  if (typeof declarator !== 'object' || declarator === null) return

  const decl = declarator as {
    init?: {
      type: string
      callee?: {
        type: string
        value?: string
        property?: { type: string; value: string }
      }
    }
    id?: { type: string; value: string }
  }

  if (!decl.init || decl.init.type !== 'CallExpression') return

  const callExpr = decl.init as unknown

  // Type check and cast for AST utility functions
  if (typeof callExpr === 'object' && callExpr !== null) {
    try {
      if (isPgTableCall(callExpr)) {
        const table = parsePgTableCall(callExpr)
        if (table) {
          tables[table.name] = table
        }
      } else if (
        decl.init.type === 'CallExpression' &&
        decl.init.callee?.type === 'MemberExpression' &&
        decl.init.callee.property?.type === 'Identifier' &&
        decl.init.callee.property.value === '$comment'
      ) {
        // Handle table comments: pgTable(...).comment(...)
        const table = parsePgTableWithComment(decl.init)
        if (table) {
          tables[table.name] = table
        }
      } else if (
        decl.init.callee?.type === 'Identifier' &&
        decl.init.callee.value === 'pgEnum'
      ) {
        const enumDef = parsePgEnumCall(callExpr)
        if (enumDef && decl.id?.type === 'Identifier') {
          enums[decl.id.value] = enumDef
        }
      } else if (
        decl.init.callee?.type === 'Identifier' &&
        decl.init.callee.value === 'relations'
      ) {
        const relationDefs = parseRelationsCall(callExpr)
        relations.push(...relationDefs)
      }
    } catch (error) {
      // Ignore parsing errors for individual declarations
      console.warn('Failed to parse declarator:', error)
    }
  }
}

/**
 * Main processor function for Drizzle schemas
 */
const parseDrizzleSchemaString = async (
  schemaString: string,
): Promise<ProcessResult> => {
  // Only run on server-side (Node.js environment)
  if (typeof window !== 'undefined') {
    return {
      value: { tables: {} },
      errors: [new Error('Drizzle parsing is only supported on server-side')],
    }
  }

  try {
    const { tables, enums } = await parseDrizzleSchema(schemaString)

    // Convert to internal format
    const result = convertDrizzleTablesToInternal(tables, enums)

    return {
      value: { tables: result.tables },
      errors: result.errors,
    }
  } catch (error) {
    return {
      value: { tables: {} },
      errors: [
        new Error(
          `Error parsing Drizzle schema: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    }
  }
}

export const processor: Processor = (str) => parseDrizzleSchemaString(str)
