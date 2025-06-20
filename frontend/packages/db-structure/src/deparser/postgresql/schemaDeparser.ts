import type { Schema, Table } from '../../schema/index.js'
import type { SchemaDeparser } from '../type.js'
import { generateCreateTableStatement } from './utils.js'

export const postgresqlSchemaDeparser: SchemaDeparser = (schema: Schema) => {
  const ddlStatements: string[] = []
  const errors: { message: string }[] = []

  // Generate CREATE TABLE statements for each table
  for (const table of Object.values(schema.tables) as Table[]) {
    const createTableDDL = generateCreateTableStatement(table)
    ddlStatements.push(createTableDDL)
  }

  // TODO: Generate indexes, constraints, and relationships in the future

  // Combine all DDL statements
  const combinedDDL = ddlStatements.join('\n\n')

  return {
    value: combinedDDL,
    errors,
  }
}
