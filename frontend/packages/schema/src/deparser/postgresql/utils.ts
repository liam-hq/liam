import type {
  Column,
  Constraint,
  Enum,
  Extension,
  Index,
  Table,
} from '../../schema/index.js'

/**
 * Generate column definition as DDL string
 */

/**
 * Escape PostgreSQL type names, handling arrays, schema-qualified types, and camelCase/PascalCase types
 * - Arrays: ScoreSource[] -> "ScoreSource"[]
 * - Schema-qualified: public.ScoreSource -> public."ScoreSource"
 * - Parameterized/spaced types: VARCHAR(255), double precision -> unchanged
 * - CamelCase types: UserRole -> "UserRole"
 */
function escapeTypeIdentifier(type: string): string {
  // If already quoted somewhere, assume caller provided the exact type
  if (type.includes('"')) return type

  // Extract array suffixes safely: find the rightmost sequence of [] brackets
  let arraySuffix = ''
  let base = type

  // Find array suffixes from the end, avoiding ReDoS vulnerability
  while (base.endsWith('[]')) {
    arraySuffix = `[]${arraySuffix}`
    base = base.slice(0, -2)
  }

  // Parameterized or spaced types (e.g., varchar(255), timestamp(3), double precision)
  // should not be quoted here.
  if (base.includes('(') || base.includes(' ')) return type

  // Support schema-qualified types: public.ScoreSource -> public."ScoreSource"
  const parts = base.split('.')
  const simpleIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/
  const allPartsSimple = parts.every((p) => simpleIdentifier.test(p))
  if (!allPartsSimple) return type

  const escaped = parts
    .map((p) => (/[A-Z]/.test(p) ? escapeIdentifier(p) : p))
    .join('.')

  return `${escaped}${arraySuffix}`
}

function generateColumnDefinition(
  column: Column,
  isPrimaryKey = false,
): string {
  let definition = `${escapeIdentifier(column.name)} ${escapeTypeIdentifier(column.type)}`

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
    // Check if it's a PostgreSQL function call (e.g., gen_random_uuid(), now(), current_timestamp())
    if (isPostgreSQLFunction(value)) {
      return value // Don't quote function calls
    }

    // Check if value is already quoted (handles enum values that might come pre-quoted)
    const trimmedValue = value.trim()
    if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
      // Value is already quoted, return as-is
      return trimmedValue
    }

    // Wrap string literals in single quotes
    return `'${trimmedValue.replace(/'/g, "''")}'` // SQL escape
  }

  if (typeof value === 'boolean') {
    // Boolean values are TRUE/FALSE in PostgreSQL
    return value.toString().toUpperCase()
  }

  // Numbers as-is
  return value.toString()
}

/**
 * Check if a string represents a PostgreSQL function call
 */
function isPostgreSQLFunction(value: string): boolean {
  const trimmedValue = value.trim()

  // Match PostgreSQL function patterns:
  // - Function name: starts with letter or underscore, followed by letters, numbers, underscores
  // - Optional whitespace before opening parenthesis
  // - Must have opening parenthesis (function calls always have parentheses)
  // Examples: gen_random_uuid(), now(), current_timestamp(), extract(epoch from now())
  const functionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/

  // PostgreSQL functions that can be used without parentheses
  // (The regex pattern above handles functions with parentheses)
  const commonFunctions = ['current_timestamp', 'current_date', 'current_time']

  // Check if it matches the general function pattern
  if (functionPattern.test(trimmedValue)) {
    return true
  }

  // Check for common functions that might have specific patterns
  return commonFunctions.some((func) =>
    trimmedValue.toLowerCase().startsWith(func.toLowerCase()),
  )
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
  let ddl = `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} ADD COLUMN ${columnDefinition};`

  // Add column comment if exists
  if (column.comment) {
    ddl += `\n\nCOMMENT ON COLUMN ${escapeIdentifier(
      tableName,
    )}.${escapeIdentifier(column.name)} IS '${escapeString(column.comment)}';`
  }

  return ddl
}

/**
 * Generate CREATE TABLE statement for a table
 */
export function generateCreateTableStatement(table: Table): string {
  const tableName = table.name

  // Generate column definitions
  const columnDefinitions = (
    Object.values(table.columns) satisfies Column[]
  ).map((column) => {
    const definition = generateColumnDefinition(column, false)
    return definition
  })

  // Basic CREATE TABLE statement
  let ddl = `CREATE TABLE ${escapeIdentifier(
    tableName,
  )} (\n  ${columnDefinitions.join(',\n  ')}\n);`

  // Add table comment
  if (table.comment) {
    ddl += `\n\nCOMMENT ON TABLE ${escapeIdentifier(
      tableName,
    )} IS '${escapeString(table.comment)}';`
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

  for (const column of Object.values(table.columns) satisfies Column[]) {
    if (column.comment) {
      comments.push(
        `COMMENT ON COLUMN ${escapeIdentifier(tableName)}.${escapeIdentifier(
          column.name,
        )} IS '${escapeString(column.comment)}';`,
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
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} DROP COLUMN ${escapeIdentifier(columnName)};`
}

/**
 * Generate RENAME COLUMN statement for a column
 */
export function generateRenameColumnStatement(
  tableName: string,
  oldColumnName: string,
  newColumnName: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} RENAME COLUMN ${escapeIdentifier(oldColumnName)} TO ${escapeIdentifier(
    newColumnName,
  )};`
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
  return `ALTER TABLE ${escapeIdentifier(
    oldTableName,
  )} RENAME TO ${escapeIdentifier(newTableName)};`
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

  return `CREATE${uniqueKeyword} INDEX ${escapeIdentifier(
    index.name,
  )} ON ${escapeIdentifier(tableName)}${indexMethod} (${columnList});`
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
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} PRIMARY KEY (${constraint.columnNames
        .map(escapeIdentifier)
        .join(', ')});`

    case 'FOREIGN KEY':
      // TODO: Consider changing the internal representation of foreign key constraints
      // from underscore format (SET_NULL, SET_DEFAULT, NO_ACTION) to space format
      // (SET NULL, SET DEFAULT, NO ACTION) to match PostgreSQL syntax directly.
      // This would be a breaking change requiring updates to all parsers and tests.
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${constraint.columnNames.map(escapeIdentifier).join(', ')}) REFERENCES ${escapeIdentifier(constraint.targetTableName)} (${constraint.targetColumnNames.map(escapeIdentifier).join(', ')}) ON UPDATE ${constraint.updateConstraint.replace('_', ' ')} ON DELETE ${constraint.deleteConstraint.replace('_', ' ')};`

    case 'UNIQUE':
      return `ALTER TABLE ${tableNameEscaped} ADD CONSTRAINT ${constraintName} UNIQUE (${constraint.columnNames
        .map(escapeIdentifier)
        .join(', ')});`

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
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} DROP CONSTRAINT ${escapeIdentifier(constraintName)};`
}

/**
 * Generate ALTER TABLE ... ALTER COLUMN ... TYPE statement
 */
export function generateAlterColumnTypeStatement(
  tableName: string,
  columnName: string,
  newType: string,
): string {
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} ALTER COLUMN ${escapeIdentifier(columnName)} TYPE ${escapeTypeIdentifier(newType)};`
}

/**
 * Generate ALTER TABLE ... ALTER COLUMN ... SET/DROP NOT NULL statement
 */
export function generateAlterColumnNotNullStatement(
  tableName: string,
  columnName: string,
  notNull: boolean,
): string {
  const action = notNull ? 'SET NOT NULL' : 'DROP NOT NULL'
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} ALTER COLUMN ${escapeIdentifier(columnName)} ${action};`
}

/**
 * Generate ALTER TABLE ... ALTER COLUMN ... SET/DROP DEFAULT statement
 */
export function generateAlterColumnDefaultStatement(
  tableName: string,
  columnName: string,
  defaultValue: string | null,
): string {
  if (defaultValue === null) {
    return `ALTER TABLE ${escapeIdentifier(
      tableName,
    )} ALTER COLUMN ${escapeIdentifier(columnName)} DROP DEFAULT;`
  }
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} ALTER COLUMN ${escapeIdentifier(
    columnName,
  )} SET DEFAULT ${formatDefaultValue(defaultValue)};`
}

/**
 * Generate COMMENT ON TABLE statement
 */
export function generateTableCommentStatement(
  tableName: string,
  comment: string | null,
): string {
  if (comment === null) {
    return `COMMENT ON TABLE ${escapeIdentifier(tableName)} IS NULL;`
  }
  return `COMMENT ON TABLE ${escapeIdentifier(tableName)} IS '${escapeString(
    comment,
  )}';`
}

/**
 * Generate COMMENT ON COLUMN statement
 */
export function generateColumnCommentStatement(
  tableName: string,
  columnName: string,
  comment: string | null,
): string {
  if (comment === null) {
    return `COMMENT ON COLUMN ${escapeIdentifier(tableName)}.${escapeIdentifier(
      columnName,
    )} IS NULL;`
  }
  return `COMMENT ON COLUMN ${escapeIdentifier(tableName)}.${escapeIdentifier(
    columnName,
  )} IS '${escapeString(comment)}';`
}

/**
 * Generate ALTER TABLE ... ADD CONSTRAINT ... CHECK statement
 */
export function generateAddCheckConstraintStatement(
  tableName: string,
  columnName: string,
  checkExpression: string,
): string {
  const constraintName = `${tableName}_${columnName}_check`
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} ADD CONSTRAINT ${escapeIdentifier(
    constraintName,
  )} CHECK (${checkExpression});`
}

/**
 * Generate ALTER TABLE ... DROP CONSTRAINT statement for column check
 */
export function generateDropCheckConstraintStatement(
  tableName: string,
  columnName: string,
): string {
  const constraintName = `${tableName}_${columnName}_check`
  return `ALTER TABLE ${escapeIdentifier(
    tableName,
  )} DROP CONSTRAINT IF EXISTS ${escapeIdentifier(constraintName)};`
}

/**
 * Generate CREATE TYPE AS ENUM statement for an enum
 */
export function generateCreateEnumStatement(enumObj: Enum): string {
  const enumName = escapeIdentifier(enumObj.name)
  const enumValues = enumObj.values
    .map((value) => `'${escapeString(value)}'`)
    .join(', ')

  let ddl = `CREATE TYPE ${enumName} AS ENUM (${enumValues});`

  // Add enum comment if exists
  if (enumObj.comment) {
    ddl += `\n\nCOMMENT ON TYPE ${enumName} IS '${escapeString(enumObj.comment)}';`
  }

  return ddl
}

/**
 * Generate CREATE EXTENSION statement from Extension type
 */
export function generateCreateExtensionStatement(extension: Extension): string {
  // Quote extension names containing hyphens or uppercase letters
  const quotedName =
    extension.name.includes('-') || /[A-Z]/.test(extension.name)
      ? `"${extension.name}"`
      : extension.name

  return `CREATE EXTENSION IF NOT EXISTS ${quotedName};`
}
