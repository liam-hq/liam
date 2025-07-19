import type { Schema } from '@liam-hq/db-structure'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'

type SchemaToDdlResult = {
  ddl: string
  errors: string[]
}

/**
 * Convert schema to DDL statements using the @liam-hq/db-structure PostgreSQL deparser
 */
export const schemaToDdl = (schema: Schema): SchemaToDdlResult => {
  const result = postgresqlSchemaDeparser(schema)

  // Add trailing newline for consistency
  const ddl = result.value ? `${result.value}\n` : ''

  return {
    ddl,
    errors: result.errors.map((err) => err.message),
  }
}
