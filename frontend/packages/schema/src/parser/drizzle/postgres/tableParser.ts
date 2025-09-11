/**
 * PostgreSQL-specific table structure parsing for Drizzle ORM schema parsing
 */

import type { CallExpression, Property } from '@swc/core'
import { getArgumentExpression, isStringLiteral } from '../shared/astUtils.js'
import { BaseDrizzleTableParser } from '../shared/tableParser.js'
import type { DatabaseSpecificConfig } from '../shared/types.js'
import { isPgTableCall } from './astUtils.js'
import { parseColumnFromProperty } from './columnParser.js'
import { PostgreSQLTypeConverter } from './typeConverter.js'
import type {
  CompositePrimaryKeyDefinition,
  DrizzleColumnDefinition,
  DrizzleEnumDefinition,
  DrizzleIndexDefinition,
  DrizzleTableDefinition,
} from './types.js'
import { isCompositePrimaryKey, isDrizzleIndex } from './types.js'

class PostgreSQLDrizzleTableParser extends BaseDrizzleTableParser {
  constructor() {
    const config: DatabaseSpecificConfig = {
      typeConverter: new PostgreSQLTypeConverter(),
      supportsInlineEnums: false,
      supportsCheckConstraints: false,
      supportsMySQLSpecificMethods: false,
    }
    super(config)
  }

  override parseColumnFromProperty(
    prop: Property,
    _extractedEnums?: Record<string, DrizzleEnumDefinition>,
  ): DrizzleColumnDefinition | null {
    return parseColumnFromProperty(prop)
  }

  override isTableCall(callExpr: CallExpression): boolean {
    return isPgTableCall(callExpr)
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

    // Get the pgTable call from the object of the member expression
    if (commentCallExpr.callee.type === 'MemberExpression') {
      const pgTableCall = commentCallExpr.callee.object
      if (
        pgTableCall.type === 'CallExpression' &&
        this.isTableCall(pgTableCall)
      ) {
        const table = this.parseTableCall(pgTableCall, extractedEnums)
        if (table && comment) {
          table.comment = comment
        }
        return table
      }
    }

    return null
  }
}

const postgresTableParser = new PostgreSQLDrizzleTableParser()

/**
 * Parse pgTable call with comment method chain
 */
export const parsePgTableWithComment = (
  commentCallExpr: CallExpression,
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

  // Get the pgTable call from the object of the member expression
  if (commentCallExpr.callee.type === 'MemberExpression') {
    const pgTableCall = commentCallExpr.callee.object
    if (pgTableCall.type === 'CallExpression' && isPgTableCall(pgTableCall)) {
      const table = postgresTableParser.parseTableCall(pgTableCall)
      if (table && comment) {
        table.comment = comment
      }
      return table
    }
  }

  return null
}

/**
 * Parse pgTable call expression
 */
export const parsePgTableCall = (
  callExpr: CallExpression,
): DrizzleTableDefinition | null => {
  return postgresTableParser.parseTableCall(callExpr)
}

/**
 * Parse schema.table() call expression
 */
export const parseSchemaTableCall = (
  callExpr: CallExpression,
): DrizzleTableDefinition | null => {
  return postgresTableParser.parseSchemaTableCall(callExpr)
}
