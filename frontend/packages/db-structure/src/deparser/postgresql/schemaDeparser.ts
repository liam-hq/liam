import type { Schema, Table } from '../../schema/index.js'
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
    const indexes = Object.values(table.indexes)
    for (const index of indexes) {
      const createIndexDDL = generateCreateIndexStatement(table.name, index)
      ddlStatements.push(createIndexDDL)
    }
  }

  // 3. Generate ADD CONSTRAINT statements for all tables
  // Note: Constraints are processed in a specific order to ensure proper dependencies:
  // 1. PRIMARY KEY constraints first (required for foreign key references)
  // 2. UNIQUE constraints second
  // 3. CHECK constraints third
  // 4. FOREIGN KEY constraints last (to ensure referenced tables/columns exist)
  const foreignKeyStatements: string[] = []
  const constraintOrder = ['PRIMARY KEY', 'UNIQUE', 'CHECK'] as const

  for (const table of Object.values(schema.tables) as Table[]) {
    const constraints = table.constraints
      ? Object.values(table.constraints)
      : []

    // Process constraints in the specified order
    for (const constraintType of constraintOrder) {
      const constraintsOfType = constraints.filter(
        (constraint) => constraint.type === constraintType,
      )

      for (const constraint of constraintsOfType) {
        const addConstraintDDL = generateAddConstraintStatement(
          table.name,
          constraint,
        )
        ddlStatements.push(addConstraintDDL)
      }
    }

    // Collect foreign key constraints to add them last
    const foreignKeyConstraints = constraints.filter(
      (constraint) => constraint.type === 'FOREIGN KEY',
    )

    for (const constraint of foreignKeyConstraints) {
      const addConstraintDDL = generateAddConstraintStatement(
        table.name,
        constraint,
      )
      foreignKeyStatements.push(addConstraintDDL)
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
