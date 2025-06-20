import type { Column, Table } from '../../schema/index.js'

/**
 * Generate column definition as DDL string
 */
function generateColumnDefinition(column: Column): string {
  let definition = `${column.name} ${column.type}`

  // Add constraints (following PostgreSQL common order)
  if (column.primary) {
    definition += ' PRIMARY KEY'
  }

  if (column.unique && !column.primary) {
    definition += ' UNIQUE'
  }

  if (column.notNull && !column.primary) {
    // PRIMARY KEY is automatically NOT NULL, so only add for non-primary columns
    definition += ' NOT NULL'
  }

  if (column.default !== null) {
    definition += ` DEFAULT ${formatDefaultValue(column.default)}`
  }

  return definition
}

/**
 * Format default value to proper SQL format
 */
function formatDefaultValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    // Wrap strings in single quotes
    return `'${value.replace(/'/g, "''")}'` // SQL escape
  }

  if (typeof value === 'boolean') {
    // Boolean values are TRUE/FALSE in PostgreSQL
    return value.toString().toUpperCase()
  }

  // Numbers as-is
  return value.toString()
}

/**
 * Escape SQL strings
 */
function escapeString(str: string): string {
  return str.replace(/'/g, "''")
}

/**
 * Generate CREATE TABLE statement for a table
 */
export function generateCreateTableStatement(table: Table): string {
  const tableName = table.name

  // Generate column definitions
  const columnDefinitions = (Object.values(table.columns) as Column[])
    .map((column) => generateColumnDefinition(column))
    .join(',\n  ')

  // Basic CREATE TABLE statement
  let ddl = `CREATE TABLE ${tableName} (\n  ${columnDefinitions}\n);`

  // Add table comment
  if (table.comment) {
    ddl += `\n\nCOMMENT ON TABLE ${tableName} IS '${escapeString(table.comment)}';`
  }

  // Add column comments
  const columnComments = generateColumnComments(tableName, table)
  if (columnComments) {
    ddl += `\n${columnComments}`
  }

  return ddl
}

/**
 * Generate COMMENT statements for columns
 */
function generateColumnComments(tableName: string, table: Table): string {
  const comments: string[] = []

  for (const column of Object.values(table.columns) as Column[]) {
    if (column.comment) {
      comments.push(
        `COMMENT ON COLUMN ${tableName}.${column.name} IS '${escapeString(column.comment)}';`,
      )
    }
  }

  return comments.join('\n')
}
