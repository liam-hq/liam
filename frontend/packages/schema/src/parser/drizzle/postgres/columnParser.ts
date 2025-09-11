/**
 * Column definition parsing for Drizzle ORM schema parsing
 */

import type { Argument, Property } from '@swc/core'
import { BaseDrizzleColumnParser } from '../shared/columnParser.js'
import type { DatabaseSpecificConfig } from '../shared/types.js'
import { PostgreSQLTypeConverter } from './typeConverter.js'
import type { DrizzleColumnDefinition } from './types.js'

class PostgreSQLDrizzleColumnParser extends BaseDrizzleColumnParser {
  constructor() {
    const config: DatabaseSpecificConfig = {
      typeConverter: new PostgreSQLTypeConverter(),
      supportsInlineEnums: false,
      supportsCheckConstraints: false,
      supportsMySQLSpecificMethods: false,
    }
    super(config)
  }

  override extractInlineEnumDefinition(): null {
    return null
  }

  protected override parseCustomMethod(
    method: { name: string; args: Argument[] },
    column: DrizzleColumnDefinition,
  ): void {
    switch (method.name) {
      case 'defaultRandom':
        column.default = 'defaultRandom'
        break
    }
  }

  protected override handleAutoIncrement(
    column: DrizzleColumnDefinition,
    baseType: string,
    _methods: Array<{ name: string; args: Argument[] }>,
  ): void {
    // Handle serial types default
    if (baseType === 'serial' && column.primaryKey) {
      column.default = 'autoincrement'
    }
  }
}

const postgresColumnParser = new PostgreSQLDrizzleColumnParser()

/**
 * Parse column definition from object property
 */
export const parseColumnFromProperty = (
  prop: Property,
): DrizzleColumnDefinition | null => {
  return postgresColumnParser.parseColumnFromProperty(prop)
}
