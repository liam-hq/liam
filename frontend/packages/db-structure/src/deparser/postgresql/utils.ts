import { hasUniqueConstraint } from '../../parser/utils/index.js'
import type { Column, Index, Table } from '../../schema/index.js'

/**
 * Generate column definition as DDL string
 */
function generateColumnDefinition(column: Column, table?: Table): string {
  let definition = `${escapeIdentifier(column.name)} ${column.type}`

  // Add constraints (following PostgreSQL common order)
  if (column.primary) {
    definition += ' PRIMARY KEY'
  }

  if (
    table &&
    hasUniqueConstraint(table.constraints, column.name) &&
    !column.primary
  ) {
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
 * Escape SQL identifiers (table names, column names) for PostgreSQL
 * Wraps identifier in double quotes and escapes internal double quotes
 */
function escapeIdentifier(identifier: string): string {
  // Escape double quotes by doubling them and wrap in double quotes
  return `"${identifier.replace(/"/g, '""')}"`
}

/**
 * Generate ADD COLUMN statement for a column
 */
export function generateAddColumnStatement(
  tableName: string,
  column: Column,
  table?: Table,
): string {
  const columnDefinition = generateColumnDefinition(column, table)
  let ddl = `ALTER TABLE ${escapeIdentifier(tableName)} ADD COLUMN ${columnDefinition};`

  // Add column comment if exists
  if (column.comment) {
    ddl += `\n\nCOMMENT ON COLUMN ${escapeIdentifier(tableName)}.${escapeIdentifier(column.name)} IS '${escapeString(column.comment)}';`
  }

  return ddl
}

/**
 * Generate CREATE TABLE statement for a table
 */
export function generateCreateTableStatement(table: Table): string {
  const tableName = table.name

  // Generate column definitions
  const columnDefinitions = (Object.values(table.columns) as Column[])
    .map((column) => generateColumnDefinition(column, table))
    .join(',\n  ')

  // Basic CREATE TABLE statement
  let ddl = `CREATE TABLE ${escapeIdentifier(tableName)} (\n  ${columnDefinitions}\n);`

  // Add table comment
  if (table.comment) {
    ddl += `\n\nCOMMENT ON TABLE ${escapeIdentifier(tableName)} IS '${escapeString(table.comment)}';`
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
        `COMMENT ON COLUMN ${escapeIdentifier(tableName)}.${escapeIdentifier(column.name)} IS '${escapeString(column.comment)}';`,
      )
    }
  }

  return comments.join('\n')
}

/**
 * Generate DROP COLUMN statement for a column
 */
export function generateRemoveColumnStatement(
  tableName: string,
  columnName: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(tableName)} DROP COLUMN ${escapeIdentifier(columnName)};`
}

/**
 * Generate DROP TABLE statement
 */
export function generateRemoveTableStatement(tableName: string): string {
  return `DROP TABLE ${escapeIdentifier(tableName)};`
}

/**
 * Generate CREATE INDEX statement for an index
 */
export function generateCreateIndexStatement(
  tableName: string,
  index: Index,
): string {
  const uniqueKeyword = index.unique ? ' UNIQUE' : ''
  const indexMethod = index.type ? ` USING ${index.type}` : ''
  const columnList = index.columns.join(', ')

  return `CREATE${uniqueKeyword} INDEX ${index.name} ON ${tableName}${indexMethod} (${columnList});`
}
