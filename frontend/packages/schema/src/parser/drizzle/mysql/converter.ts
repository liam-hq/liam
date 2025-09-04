/**
 * Data conversion logic for Drizzle ORM MySQL schema parsing
 */

import type {
  Column,
  Columns,
  Constraints,
  Enum,
  ForeignKeyConstraint,
  Index,
  Table,
} from '../../../schema/index.js'
import {
  convertDefaultValue,
  convertDrizzleTypeToMysqlType,
  convertReferenceOption,
} from './convertToMysqlType.js'
import type { DrizzleEnumDefinition, DrizzleTableDefinition } from './types.js'

/**
 * Convert Drizzle table definition to internal Table format
 */
const convertToTable = (
  tableDef: DrizzleTableDefinition,
  enums: Record<string, DrizzleEnumDefinition> = {},
  variableToTableMapping: Record<string, string> = {},
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
): Table => {
  const columns: Columns = {}
  const constraints: Constraints = {}
  const indexes: Record<string, Index> = {}

  // Convert columns
  for (const [columnName, columnDef] of Object.entries(tableDef.columns)) {
    // Check if this is an enum type and get the actual enum name
    let columnType = columnDef.type

    // Check if this is an enum variable name (like userRoleEnum -> user_role)
    for (const [enumVarName, enumDef] of Object.entries(enums)) {
      if (columnDef.type === enumVarName) {
        columnType = enumDef.name
        break
      }
    }

    // If not found, it might be a call to an enum function (like roleEnum('role'))
    // In this case, the type is already the enum name from the first argument
    if (columnType === columnDef.type) {
      // Check if any enum definition matches this type name
      for (const enumDef of Object.values(enums)) {
        if (enumDef.name === columnDef.type) {
          columnType = enumDef.name
          break
        }
      }
    }

    const column: Column = {
      name: columnDef.name,
      type: convertDrizzleTypeToMysqlType(columnType, columnDef.typeOptions),
      default: convertDefaultValue(
        columnDef.default ||
          (columnType === 'int' && columnDef.primaryKey
            ? 'autoincrement()'
            : undefined),
        columnType,
      ),
      notNull: columnDef.notNull,
      comment: columnDef.comment || null,
      check: null,
    }
    columns[columnName] = column

    // Add primary key constraint
    if (columnDef.primaryKey) {
      const constraintName = `PRIMARY_${columnDef.name}`
      constraints[constraintName] = {
        type: 'PRIMARY KEY',
        name: constraintName,
        columnNames: [columnDef.name],
      }

      // Add primary key index
      const indexName = `${tableDef.name}_pkey`
      indexes[indexName] = {
        name: indexName,
        columns: [columnDef.name],
        unique: true,
        type: '',
      }
    }

    // Add unique constraint (inline unique does not create index, only constraint)
    if (columnDef.unique && !columnDef.primaryKey) {
      const constraintName = `UNIQUE_${columnDef.name}`
      constraints[constraintName] = {
        type: 'UNIQUE',
        name: constraintName,
        columnNames: [columnDef.name],
      }
    }

    // Add foreign key constraint
    if (columnDef.references) {
      // Resolve variable name to actual table name
      const targetTableName =
        variableToTableMapping[columnDef.references.table] ||
        columnDef.references.table

      const constraintName = `${tableDef.name}_${columnDef.name}_${columnDef.references.table}_${columnDef.references.column}_fk`
      const constraint: ForeignKeyConstraint = {
        type: 'FOREIGN KEY',
        name: constraintName,
        columnNames: [columnDef.name], // Use actual column name, not JS property name
        targetTableName: targetTableName,
        targetColumnNames: [columnDef.references.column],
        updateConstraint: columnDef.references.onUpdate
          ? convertReferenceOption(columnDef.references.onUpdate)
          : 'NO_ACTION',
        deleteConstraint: columnDef.references.onDelete
          ? convertReferenceOption(columnDef.references.onDelete)
          : 'NO_ACTION',
      }
      constraints[constraintName] = constraint
    }
  }

  // Handle composite primary key
  if (tableDef.compositePrimaryKey) {
    // Map JS property names to actual column names
    const actualColumnNames = tableDef.compositePrimaryKey.columns
      .map((jsPropertyName) => {
        const columnDef = tableDef.columns[jsPropertyName]
        return columnDef ? columnDef.name : jsPropertyName
      })
      .filter((name) => name && name.length > 0)

    // Create composite primary key constraint
    const constraintName = `${tableDef.name}_pkey`
    constraints[constraintName] = {
      type: 'PRIMARY KEY',
      name: constraintName,
      columnNames: actualColumnNames,
    }

    // Add composite primary key index
    indexes[constraintName] = {
      name: constraintName,
      columns: actualColumnNames,
      unique: true,
      type: '',
    }
  }

  // Convert indexes
  for (const [_, indexDef] of Object.entries(tableDef.indexes)) {
    // Map JS property names to actual column names
    const actualColumnNames = indexDef.columns.map((jsPropertyName) => {
      const columnDef = tableDef.columns[jsPropertyName]
      return columnDef ? columnDef.name : jsPropertyName
    })

    // Use the actual index name from the definition
    const actualIndexName = indexDef.name
    indexes[actualIndexName] = {
      name: actualIndexName,
      columns: actualColumnNames,
      unique: indexDef.unique,
      type: indexDef.type || '',
    }
  }

  // Convert constraints from Drizzle table definition
  if (tableDef.constraints) {
    for (const [constraintName, constraintDef] of Object.entries(
      tableDef.constraints,
    )) {
      constraints[constraintName] = constraintDef
    }
  }

  return {
    name: tableDef.name,
    columns,
    constraints,
    indexes,
    comment: tableDef.comment || null,
  }
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
