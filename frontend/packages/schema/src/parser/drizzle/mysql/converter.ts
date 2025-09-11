/**
 * Data conversion logic for Drizzle ORM MySQL schema parsing
 */

import type { Enum, Table } from '../../../schema/index.js'
import { BaseDrizzleConverter } from '../shared/converter.js'
import type { DatabaseSpecificConfig } from '../shared/types.js'
import { MySQLTypeConverter } from './typeConverter.js'
import type { DrizzleEnumDefinition, DrizzleTableDefinition } from './types.js'

class MySQLDrizzleConverter extends BaseDrizzleConverter {
  constructor() {
    const config: DatabaseSpecificConfig = {
      typeConverter: new MySQLTypeConverter(),
      supportsInlineEnums: true,
      supportsCheckConstraints: true,
      supportsMySQLSpecificMethods: true,
    }
    super(config)
  }

  protected override getAutoIncrementDefault(
    columnType: string,
    isPrimaryKey?: boolean,
  ): unknown {
    return columnType === 'int' && isPrimaryKey ? 'autoincrement()' : undefined
  }
}

const mysqlConverter = new MySQLDrizzleConverter()

/**
 * Convert Drizzle table definition to internal Table format
 */
const convertToTable = (
  tableDef: DrizzleTableDefinition,
  enums: Record<string, DrizzleEnumDefinition> = {},
  variableToTableMapping: Record<string, string> = {},
): Table => {
  return mysqlConverter.convertToTable(tableDef, enums, variableToTableMapping)
}

/**
 * Fix foreign key constraint targetColumnName from JS property names to actual DB column names
 */
const fixForeignKeyTargetColumnNames = (
  tables: Record<string, Table>,
  drizzleTables: Record<string, DrizzleTableDefinition>,
): void => {
  for (const table of Object.values(tables)) {
    for (const constraint of Object.values(table.constraints)) {
      if (constraint.type === 'FOREIGN KEY') {
        // Check in drizzleTables for column mapping
        const drizzleTargetTable = drizzleTables[constraint.targetTableName]
        if (drizzleTargetTable) {
          // Map each target column from JS property name to actual DB column name
          constraint.targetColumnNames = constraint.targetColumnNames.map(
            (jsPropertyName) => {
              const targetColumnDef = drizzleTargetTable.columns[jsPropertyName]
              return targetColumnDef ? targetColumnDef.name : jsPropertyName
            },
          )
        }
      }
    }
  }
}

/**
 * Convert parsed Drizzle tables to internal format with error handling
 */
export const convertDrizzleTablesToInternal = (
  drizzleTables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  variableToTableMapping: Record<string, string> = {},
): { tables: Record<string, Table>; errors: Error[] } => {
  const tables: Record<string, Table> = {}
  const errors: Error[] = []

  // Convert Drizzle tables to internal format
  for (const tableDef of Object.values(drizzleTables)) {
    try {
      // Use original table name for the key, not schema-prefixed name
      // This maintains compatibility while handling schema namespaces internally
      tables[tableDef.name] = convertToTable(
        tableDef,
        enums,
        variableToTableMapping,
      )
    } catch (error) {
      errors.push(
        new Error(
          `Error parsing table ${tableDef.name}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
    }
  }

  // Fix foreign key constraint targetColumnName from JS property names to actual DB column names
  fixForeignKeyTargetColumnNames(tables, drizzleTables)

  return { tables, errors }
}

/**
 * Convert Drizzle enum definitions to internal format
 */
export const convertDrizzleEnumsToInternal = (
  enums: Record<string, DrizzleEnumDefinition>,
): Record<string, Enum> => {
  const convertedEnums: Record<string, Enum> = {}

  for (const enumDef of Object.values(enums)) {
    if (convertedEnums[enumDef.name]) continue // avoid accidental overwrite
    convertedEnums[enumDef.name] = {
      name: enumDef.name,
      values: enumDef.values,
      comment: null,
    }
  }

  return convertedEnums
}
