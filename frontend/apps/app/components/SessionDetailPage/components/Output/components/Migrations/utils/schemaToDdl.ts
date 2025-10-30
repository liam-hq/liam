import type { Schema } from '@liam-hq/schema'
import { postgresqlSchemaDeparser } from '@liam-hq/schema'

type SchemaToDdlResult = {
  ddl: string
  errors: string[]
}

/**
 * Convert schema to DDL statements using the @liam-hq/schema PostgreSQL deparser
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
