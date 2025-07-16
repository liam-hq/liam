import type { Column, Constraint, Schema, Table } from '@liam-hq/db-structure'

type ColumnConfig = {
  name?: string
  type: string
  default?: string | number | boolean | null
  check?: string | null
  notNull?: boolean
  comment?: string | null
}

type TableConfig = {
  name?: string
  columns: Record<string, ColumnConfig>
  primaryKey?: string[]
  foreignKeys?: Array<{
    columns: string[]
    targetTable: string
    targetColumns: string[]
  }>
  comment?: string | null
}

type SchemaConfig = {
  tables: Record<string, TableConfig>
}

const createColumn = (config: ColumnConfig): Column => ({
  name: config.name || 'column',
  type: config.type,
  default: config.default !== undefined ? config.default : null,
  check: config.check !== undefined ? config.check : null,
  notNull: config.notNull || false,
  comment: config.comment !== undefined ? config.comment : null,
})

const createTable = (name: string, config: TableConfig): Table => {
  const columns: Record<string, Column> = {}
  for (const [colName, colConfig] of Object.entries(config.columns)) {
    columns[colName] = createColumn({ ...colConfig, name: colName })
  }

  const constraints: Record<string, Constraint> = {}

  // Add primary key constraint if specified
  if (config.primaryKey && config.primaryKey.length > 0) {
    constraints[`pk_${name}`] = {
      type: 'PRIMARY KEY',
      name: `pk_${name}`,
      columnNames: config.primaryKey,
    }
  }

  // Add foreign key constraints if specified
  if (config.foreignKeys) {
    for (const fk of config.foreignKeys) {
      constraints[`fk_${name}_${fk.columns[0]}`] = {
        type: 'FOREIGN KEY',
        name: `fk_${name}_${fk.columns[0]}`,
        columnNames: fk.columns,
        targetTableName: fk.targetTable,
        targetColumnNames: fk.targetColumns,
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      }
    }
  }

  return {
    name: config.name || name,
    columns,
    comment: config.comment !== undefined ? config.comment : null,
    indexes: {},
    constraints,
  }
}

export const createSchema = (config: SchemaConfig): Schema => {
  const tables: Record<string, Table> = {}
  for (const [tableName, tableConfig] of Object.entries(config.tables)) {
    tables[tableName] = createTable(tableName, tableConfig)
  }
  return { tables }
}
