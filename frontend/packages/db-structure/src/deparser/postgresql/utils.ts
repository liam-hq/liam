import type { Column, Constraint, Index, Table } from '../../schema/index.js'

/**
 * Generate column definition as DDL string
 */
function generateColumnDefinition(
  column: Column,
  isPrimaryKey = false,
): string {
  let definition = `${escapeIdentifier(column.name)} ${column.type}`

  // Add constraints (following PostgreSQL common order)
  // Don't add NOT NULL if this will be a PRIMARY KEY
  if (column.notNull && !isPrimaryKey) {
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
): string {
  const columnDefinition = generateColumnDefinition(column)
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
  const columnDefinitions = (Object.values(table.columns) as Column[]).map(
    (column) => {
      const definition = generateColumnDefinition(column, false)
      return definition
    },
  )

  // Basic CREATE TABLE statement
  let ddl = `CREATE TABLE ${escapeIdentifier(tableName)} (\n  ${columnDefinitions.join(',\n  ')}\n);`

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
 * Generate RENAME COLUMN statement for a column
 */
export function generateRenameColumnStatement(
  tableName: string,
  oldColumnName: string,
  newColumnName: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(tableName)} RENAME COLUMN ${escapeIdentifier(oldColumnName)} TO ${escapeIdentifier(newColumnName)};`
}

/**
 * Generate DROP TABLE statement
 */
export function generateRemoveTableStatement(tableName: string): string {
  return `DROP TABLE ${escapeIdentifier(tableName)};`
}

/**
 * Generate RENAME TABLE statement
 */
export function generateRenameTableStatement(
  oldTableName: string,
  newTableName: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(oldTableName)} RENAME TO ${escapeIdentifier(newTableName)};`
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
  const columnList = index.columns
    .map((col) => escapeIdentifier(col))
    .join(', ')

  return `CREATE${uniqueKeyword} INDEX ${escapeIdentifier(index.name)} ON ${escapeIdentifier(tableName)}${indexMethod} (${columnList});`
}

/**
 * Generate DROP INDEX statement
 */
export function generateRemoveIndexStatement(indexName: string): string {
  return `DROP INDEX ${escapeIdentifier(indexName)};`
}

/**
 * Generate ADD CONSTRAINT statement for a constraint
 */
export function generateAddConstraintStatement(
  tableName: string,
  constraint: Constraint,
): string {
  const constraintName = escapeIdentifier(constraint.name)
  const tableNameEscaped = escapeIdentifier(tableName)

  switch (constraint.type) {
    case 'PRIMARY KEY':
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} PRIMARY KEY (${escapeIdentifier(constraint.columnName)});`

    case 'FOREIGN KEY':
      // TODO: Consider changing the internal representation of foreign key constraints
      // from underscore format (SET_NULL, SET_DEFAULT, NO_ACTION) to space format
      // (SET NULL, SET DEFAULT, NO ACTION) to match PostgreSQL syntax directly.
      // This would be a breaking change requiring updates to all parsers and tests.
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${escapeIdentifier(constraint.columnName)}) REFERENCES ${escapeIdentifier(constraint.targetTableName)} (${escapeIdentifier(constraint.targetColumnName)}) ON UPDATE ${constraint.updateConstraint.replace('_', ' ')} ON DELETE ${constraint.deleteConstraint.replace('_', ' ')};`

    case 'UNIQUE':
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} UNIQUE (${escapeIdentifier(constraint.columnName)});`

    case 'CHECK':
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} CHECK (${constraint.detail});`

    default:
      return constraint satisfies never
  }
}

/**
 * Generate DROP CONSTRAINT statement
 */
export function generateRemoveConstraintStatement(
  tableName: string,
  constraintName: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(tableName)} DROP CONSTRAINT ${escapeIdentifier(constraintName)};`
}
