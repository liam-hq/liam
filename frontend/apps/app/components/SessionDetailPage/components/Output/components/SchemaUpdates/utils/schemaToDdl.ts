import type {
  Column,
  Constraint,
  Index,
  Schema,
  Table,
} from '@liam-hq/db-structure'

type SchemaToDdlResult = {
  ddl: string
  errors: string[]
}

// Using actual types from @liam-hq/db-structure

/**
 * Convert schema to DDL statements
 */
export const schemaToDdl = (schema: Schema): SchemaToDdlResult => {
  const ddlStatements: string[] = []
  const errors: string[] = []

  try {
    // Generate CREATE TABLE statements for all tables
    for (const table of Object.values(schema.tables)) {
      const tableStatement = generateCreateTableStatement(table)
      if (tableStatement) {
        ddlStatements.push(tableStatement)
      }
    }

    // Generate CREATE INDEX statements
    for (const table of Object.values(schema.tables)) {
      for (const index of Object.values(table.indexes)) {
        const indexStatement = generateCreateIndexStatement(table.name, index)
        if (indexStatement) {
          ddlStatements.push(indexStatement)
        }
      }
    }

    return {
      ddl: ddlStatements.join('\n\n'),
      errors,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      ddl: '',
      errors,
    }
  }
}

/**
 * Generate diff DDL between two schemas using direct comparison
 */
export const generateDiffDdl = (
  currentSchema: Schema,
  prevSchema: Schema,
): SchemaToDdlResult => {
  const ddlStatements: string[] = []
  const errors: string[] = []

  try {
    // Compare tables directly
    const currentTables = currentSchema.tables
    const prevTables = prevSchema.tables

    // Find added tables
    for (const [tableId, table] of Object.entries(currentTables)) {
      if (!prevTables[tableId]) {
        ddlStatements.push(`-- ADDED: table ${table.name}`)
        ddlStatements.push(generateCreateTableStatement(table))
      }
    }

    // Find removed tables
    for (const [tableId, table] of Object.entries(prevTables)) {
      if (!currentTables[tableId]) {
        ddlStatements.push(`-- REMOVED: table ${table.name}`)
        ddlStatements.push(`DROP TABLE ${table.name};`)
      }
    }

    // Find modified tables (compare columns)
    for (const [tableId, currentTable] of Object.entries(currentTables)) {
      const prevTable = prevTables[tableId]
      if (!prevTable) continue

      const tableDiff = compareTableColumns(currentTable, prevTable)
      if (tableDiff.length > 0) {
        ddlStatements.push(`-- MODIFIED: table ${currentTable.name}`)
        ddlStatements.push(...tableDiff)
      }
    }

    return {
      ddl: ddlStatements.join('\n\n'),
      errors,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      ddl: '',
      errors,
    }
  }
}

/**
 * Generate column definition string
 */
const generateColumnDefinition = (column: Column): string => {
  let columnDef = `${column.name} ${column.type}`
  if (column.notNull) columnDef += ' NOT NULL'
  if (column.default) columnDef += ` DEFAULT ${column.default}`
  return columnDef
}

/**
 * Find added columns and generate ADD COLUMN statements
 */
const findAddedColumns = (
  currentColumns: Record<string, Column>,
  prevColumns: Record<string, Column>,
  tableName: string,
): string[] => {
  const statements: string[] = []

  for (const [columnId, column] of Object.entries(currentColumns)) {
    if (!prevColumns[columnId]) {
      const columnDef = generateColumnDefinition(column)
      statements.push(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`)
    }
  }

  return statements
}

/**
 * Find removed columns and generate DROP COLUMN statements
 */
const findRemovedColumns = (
  currentColumns: Record<string, Column>,
  prevColumns: Record<string, Column>,
  tableName: string,
): string[] => {
  const statements: string[] = []

  for (const [columnId, column] of Object.entries(prevColumns)) {
    if (!currentColumns[columnId]) {
      statements.push(`ALTER TABLE ${tableName} DROP COLUMN ${column.name};`)
    }
  }

  return statements
}

/**
 * Check if column properties have changed
 */
const hasColumnChanges = (
  currentColumn: Column,
  prevColumn: Column,
): boolean => {
  return (
    currentColumn.type !== prevColumn.type ||
    currentColumn.notNull !== prevColumn.notNull ||
    currentColumn.default !== prevColumn.default
  )
}

/**
 * Find modified columns and generate ALTER COLUMN statements
 */
const findModifiedColumns = (
  currentColumns: Record<string, Column>,
  prevColumns: Record<string, Column>,
  tableName: string,
): string[] => {
  const statements: string[] = []

  for (const [columnId, currentColumn] of Object.entries(currentColumns)) {
    const prevColumn = prevColumns[columnId]
    if (!prevColumn) continue

    if (hasColumnChanges(currentColumn, prevColumn)) {
      const columnDef = generateColumnDefinition(currentColumn)
      statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnDef};`)
    }
  }

  return statements
}

/**
 * Compare columns between two tables and generate ALTER TABLE statements
 */
const compareTableColumns = (
  currentTable: Table,
  prevTable: Table,
): string[] => {
  const currentColumns = currentTable.columns
  const prevColumns = prevTable.columns
  const tableName = currentTable.name

  const addedColumns = findAddedColumns(currentColumns, prevColumns, tableName)
  const removedColumns = findRemovedColumns(
    currentColumns,
    prevColumns,
    tableName,
  )
  const modifiedColumns = findModifiedColumns(
    currentColumns,
    prevColumns,
    tableName,
  )

  return [...addedColumns, ...removedColumns, ...modifiedColumns]
}

/**
 * Generate CREATE TABLE statement for a table
 */
const generateCreateTableStatement = (table: Table): string => {
  const columns = Object.values(table.columns)
    .map((col: Column) => {
      let columnDef = `  ${col.name} ${col.type}`
      if (col.notNull) columnDef += ' NOT NULL'
      if (col.default) columnDef += ` DEFAULT ${col.default}`
      if (col.check) columnDef += ` CHECK (${col.check})`
      return columnDef
    })
    .join(',\n')

  let statement = `CREATE TABLE ${table.name} (\n${columns}`

  // Add constraints
  const constraints = Object.values(table.constraints)
    .map((constraint: Constraint) => {
      switch (constraint.type) {
        case 'PRIMARY KEY':
          return `  CONSTRAINT ${constraint.name} PRIMARY KEY (${constraint.columnNames.join(', ')})`
        case 'FOREIGN KEY': {
          if (
            'targetTableName' in constraint &&
            'targetColumnNames' in constraint
          ) {
            const fkConstraint = constraint
            return `  CONSTRAINT ${constraint.name} FOREIGN KEY (${constraint.columnNames.join(', ')}) REFERENCES ${fkConstraint.targetTableName}(${fkConstraint.targetColumnNames.join(', ')})`
          }
          return null
        }
        case 'UNIQUE':
          return `  CONSTRAINT ${constraint.name} UNIQUE (${constraint.columnNames.join(', ')})`
        case 'CHECK': {
          if ('detail' in constraint) {
            const checkConstraint = constraint
            return `  CONSTRAINT ${constraint.name} CHECK (${checkConstraint.detail})`
          }
          return null
        }
        default:
          return null
      }
    })
    .filter(Boolean)

  if (constraints.length > 0) {
    statement += `,\n${constraints.join(',\n')}`
  }

  statement += '\n);'

  if (table.comment) {
    statement += `\n\nCOMMENT ON TABLE ${table.name} IS '${table.comment}';`
  }

  // Add column comments
  for (const col of Object.values(table.columns)) {
    if (col.comment) {
      statement += `\nCOMMENT ON COLUMN ${table.name}.${col.name} IS '${col.comment}';`
    }
  }

  return statement
}

/**
 * Generate CREATE INDEX statement for an index
 */
const generateCreateIndexStatement = (
  tableName: string,
  index: Index,
): string => {
  const uniqueKeyword = index.unique ? 'UNIQUE ' : ''
  const columns = index.columns.join(', ')
  const indexType =
    index.type && index.type !== 'btree' ? ` USING ${index.type}` : ''
  return `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${tableName}${indexType} (${columns});`
}
