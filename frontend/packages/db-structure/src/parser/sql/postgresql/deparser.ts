import type {
  Column,
  Constraint,
  Relationship,
  Schema,
  Table,
} from '../../../schema/index.js'
import { type ProcessError, UnexpectedTokenWarningError } from '../../errors.js'

/**
 * Convert Schema object back to PostgreSQL DDL statements
 */
export const deparser = (
  schema: Schema,
): { value: string[]; errors: ProcessError[] } => {
  const statements: string[] = []
  const errors: ProcessError[] = []

  try {
    for (const table of Object.values(schema.tables)) {
      const tableStatements = generateCreateTableStatement(table)
      statements.push(...tableStatements)
    }

    for (const table of Object.values(schema.tables)) {
      const indexStatements = generateIndexStatements(table)
      statements.push(...indexStatements)
    }

    for (const relationship of Object.values(schema.relationships)) {
      const alterStatement = generateAlterTableForForeignKey(relationship)
      if (alterStatement) {
        statements.push(alterStatement)
      }
    }

    for (const table of Object.values(schema.tables)) {
      const commentStatements = generateCommentStatements(table)
      statements.push(...commentStatements)
    }

    return { value: statements, errors }
  } catch (error) {
    errors.push(
      new UnexpectedTokenWarningError(
        `Deparser error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
    return { value: [], errors }
  }
}

/**
 * Generate CREATE TABLE statement for a table
 */
function generateCreateTableStatement(table: Table): string[] {
  const statements: string[] = []
  const columnDefinitions: string[] = []

  for (const column of Object.values(table.columns)) {
    const columnDef = generateColumnDefinition(column)
    columnDefinitions.push(`  ${columnDef}`)
  }

  const inlineConstraints = generateInlineConstraints(table.constraints)
  columnDefinitions.push(...inlineConstraints.map((c) => `  ${c}`))

  const createTableSQL = [
    `CREATE TABLE ${table.name} (`,
    columnDefinitions.join(',\n'),
    ');',
  ].join('\n')

  statements.push(createTableSQL)
  return statements
}

/**
 * Generate column definition string
 */
function generateColumnDefinition(column: Column): string {
  let definition = `${column.name} ${column.type.toUpperCase()}`

  if (column.default !== null) {
    if (typeof column.default === 'string') {
      definition += ` DEFAULT '${column.default.replace(/'/g, "''")}'`
    } else {
      definition += ` DEFAULT ${column.default}`
    }
  }

  if (column.primary) {
    definition += ' PRIMARY KEY'
  }

  if (column.notNull && !column.primary) {
    definition += ' NOT NULL'
  }

  if (column.unique && !column.primary) {
    definition += ' UNIQUE'
  }

  return definition
}

/**
 * Generate inline constraints for CREATE TABLE
 */
function generateInlineConstraints(
  constraints: Record<string, Constraint>,
): string[] {
  const inlineConstraints: string[] = []

  for (const constraint of Object.values(constraints)) {
    if (constraint.type === 'CHECK') {
      inlineConstraints.push(
        `CONSTRAINT ${constraint.name} ${constraint.detail}`,
      )
    }
  }

  return inlineConstraints
}

/**
 * Generate ALTER TABLE statement for foreign key constraint
 */
function generateAlterTableForForeignKey(
  relationship: Relationship,
): string | null {
  const updateAction =
    relationship.updateConstraint !== 'NO_ACTION'
      ? ` ON UPDATE ${relationship.updateConstraint}`
      : ''
  const deleteAction =
    relationship.deleteConstraint !== 'NO_ACTION'
      ? ` ON DELETE ${relationship.deleteConstraint}`
      : ''

  return (
    `ALTER TABLE ${relationship.foreignTableName} ` +
    `ADD CONSTRAINT ${relationship.name} ` +
    `FOREIGN KEY (${relationship.foreignColumnName}) ` +
    `REFERENCES ${relationship.primaryTableName}(${relationship.primaryColumnName})` +
    `${updateAction}${deleteAction};`
  )
}

/**
 * Generate CREATE INDEX statements for a table
 */
function generateIndexStatements(table: Table): string[] {
  const statements: string[] = []

  for (const index of Object.values(table.indexes)) {
    const uniqueKeyword = index.unique ? 'UNIQUE ' : ''
    const usingClause = index.type ? ` USING ${index.type}` : ''
    const columnsClause = index.columns.join(', ')

    const indexSQL = `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${table.name}${usingClause} (${columnsClause});`
    statements.push(indexSQL)
  }

  return statements
}

/**
 * Generate COMMENT statements for table and columns
 */
function generateCommentStatements(table: Table): string[] {
  const statements: string[] = []

  if (table.comment) {
    const escapedComment = table.comment.replace(/'/g, "''")
    statements.push(`COMMENT ON TABLE ${table.name} IS '${escapedComment}';`)
  }

  for (const column of Object.values(table.columns)) {
    if (column.comment) {
      const escapedComment = column.comment.replace(/'/g, "''")
      statements.push(
        `COMMENT ON COLUMN ${table.name}.${column.name} IS '${escapedComment}';`,
      )
    }
  }

  return statements
}
