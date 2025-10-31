import type { Schema } from '@liam-hq/schema'
import { postgresqlSchemaDiffDeparser } from '@liam-hq/schema'

type SchemaToDdlResult = {
  ddl: string
  errors: string[]
}

/**
 * Convert schema diff to DDL migration statements using the @liam-hq/schema PostgreSQL diff deparser
 */
export const schemaToDdl = (
  before: Schema,
  after: Schema,
): SchemaToDdlResult => {
  const result = postgresqlSchemaDiffDeparser(before, after)

  // Add trailing newline for consistency
  const ddl = result.value ? `${result.value}\n` : ''

  return {
    ddl,
    errors: result.errors.map((err: { message: string }) => err.message),
  }
}
