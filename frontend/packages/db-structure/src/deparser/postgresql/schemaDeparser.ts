import type { Index, Schema, Table } from '../../schema/index.js'
import type { SchemaDeparser } from '../type.js'
import {
  generateAddConstraintStatement,
  generateCreateIndexStatement,
  generateCreateTableStatement,
} from './utils.js'

export const postgresqlSchemaDeparser: SchemaDeparser = (schema: Schema) => {
  const ddlStatements: string[] = []
  const errors: { message: string }[] = []

  // 1. Generate CREATE TABLE statements for each table
  for (const table of Object.values(schema.tables) as Table[]) {
    const createTableDDL = generateCreateTableStatement(table)
    ddlStatements.push(createTableDDL)
  }

  // 2. Generate CREATE INDEX statements for all tables
  for (const table of Object.values(schema.tables) as Table[]) {
    const indexes = Object.values(table.indexes) as Index[]
    for (const index of indexes) {
      const createIndexDDL = generateCreateIndexStatement(table.name, index)
      ddlStatements.push(createIndexDDL)
    }
  }

  // 3. Generate ADD CONSTRAINT statements for all tables
  // Note: Foreign key constraints are added last to ensure referenced tables exist
  const foreignKeyStatements: string[] = []

  for (const table of Object.values(schema.tables) as Table[]) {
    const constraints = Object.values(table.constraints)
    for (const constraint of constraints) {
      const addConstraintDDL = generateAddConstraintStatement(
        table.name,
        constraint,
      )

      // Separate foreign key constraints to add them last
      if (constraint.type === 'FOREIGN KEY') {
        foreignKeyStatements.push(addConstraintDDL)
      } else {
        ddlStatements.push(addConstraintDDL)
      }
    }
  }

  // Add foreign key constraints at the end
  ddlStatements.push(...foreignKeyStatements)
  // Combine all DDL statements
  const combinedDDL = ddlStatements.join('\n\n')

  return {
    value: combinedDDL,
    errors,
  }
}
