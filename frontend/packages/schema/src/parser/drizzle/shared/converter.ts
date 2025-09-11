import type {
  Column,
  Columns,
  Constraint,
  Constraints,
  ForeignKeyConstraint,
  Index,
  Table,
} from '../../../schema/index.js'
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

type DrizzleTableDefinition = {
  name: string
  columns: Record<string, DrizzleColumnDefinition>
  indexes: Record<string, unknown>
  constraints?: Record<string, unknown>
  compositePrimaryKey?: {
    type: 'primaryKey'
    columns: string[]
  }
  comment?: string | undefined
  schemaName?: string
}

export class BaseDrizzleConverter {
  protected config: DatabaseSpecificConfig

  constructor(config: DatabaseSpecificConfig) {
    this.config = config
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Consolidated logic from MySQL/PostgreSQL parsers
  convertToTable(
    tableDef: DrizzleTableDefinition,
    enums: Record<string, DrizzleEnumDefinition> = {},
    variableToTableMapping: Record<string, string> = {},
  ): Table {
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
        type: this.config.typeConverter.convertDrizzleType(
          columnType,
          columnDef.typeOptions,
        ),
        default: this.config.typeConverter.convertDefaultValue(
          columnDef.default ||
            this.getAutoIncrementDefault(columnType, columnDef.primaryKey),
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
            ? this.config.typeConverter.convertReferenceOption(
                columnDef.references.onUpdate,
              )
            : 'NO_ACTION',
          deleteConstraint: columnDef.references.onDelete
            ? this.config.typeConverter.convertReferenceOption(
                columnDef.references.onDelete,
              )
            : 'NO_ACTION',
        }
        constraints[constraintName] = constraint
      }
    }

    // Handle composite primary key
    if (tableDef.compositePrimaryKey) {
      // Map JS property names to actual column names
      const actualColumnNames = tableDef.compositePrimaryKey.columns
        .map((jsPropertyName: string) => {
          const columnDef = tableDef.columns[jsPropertyName]
          return columnDef ? columnDef.name : jsPropertyName
        })
        .filter((name: string) => name && name.length > 0)

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
      if (this.isValidIndexDefinition(indexDef)) {
        // Map JS property names to actual column names
        const actualColumnNames = indexDef.columns.map(
          (jsPropertyName: string) => {
            const columnDef = tableDef.columns[jsPropertyName]
            return columnDef ? columnDef.name : jsPropertyName
          },
        )

        // Use the actual index name from the definition
        const actualIndexName = String(indexDef.name)
        indexes[actualIndexName] = {
          name: actualIndexName,
          columns: actualColumnNames,
          unique: Boolean(indexDef.unique),
          type: String(indexDef.type || ''),
        }
      }
    }

    // Convert constraints from Drizzle table definition (MySQL supports check constraints)
    if (this.config.supportsCheckConstraints && tableDef.constraints) {
      for (const [constraintName, constraintDef] of Object.entries(
        tableDef.constraints,
      )) {
        if (this.isValidConstraint(constraintDef)) {
          constraints[constraintName] = constraintDef
        }
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

  protected getAutoIncrementDefault(
    _columnType: string,
    _isPrimaryKey?: boolean,
  ): unknown {
    return undefined
  }

  private isValidIndexDefinition(indexDef: unknown): indexDef is {
    columns: string[]
    name: string
    unique?: boolean
    type?: string
  } {
    return (
      indexDef !== null &&
      typeof indexDef === 'object' &&
      'columns' in indexDef &&
      Array.isArray(indexDef.columns) &&
      'name' in indexDef &&
      typeof indexDef.name === 'string'
    )
  }

  private isValidConstraint(
    constraintDef: unknown,
  ): constraintDef is Constraint {
    return (
      constraintDef !== null &&
      typeof constraintDef === 'object' &&
      'type' in constraintDef &&
      'name' in constraintDef &&
      typeof constraintDef.name === 'string'
    )
  }
}
