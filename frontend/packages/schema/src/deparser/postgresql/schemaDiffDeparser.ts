import { getMigrationOperations } from '../../migrationOperation/utils/getMigrationOperations.js'
import type { Schema } from '../../schema/index.js'
import type { LegacySchemaDeparser } from '../type.js'
import { postgresqlMigrationOperationDeparser } from './migrationOperationDeparser.js'

/**
 * PostgreSQL schema diff deparser
 * Generates migration DDL statements by comparing two schemas (before and after)
 *
 * @param before - The original schema state
 * @param after - The target schema state
 * @returns Combined DDL statements with any errors encountered
 *
 * @deprecated This implementation uses LegacySchemaDeparser type.
 * TODO: Migrate to new SchemaDeparser type (Result<string, Error>) for better error handling.
 *
 * @example
 * const beforeSchema = { tables: { users: { ... } }, ... }
 * const afterSchema = { tables: { users: { ... }, posts: { ... } }, ... }
 * const result = postgresqlSchemaDiffDeparser(beforeSchema, afterSchema)
 * // result.value contains: "CREATE TABLE posts (...); ..."
 */
export const postgresqlSchemaDiffDeparser = (
  before: Schema,
  after: Schema,
): ReturnType<LegacySchemaDeparser> => {
  const ddlStatements: string[] = []
  const errors: { message: string }[] = []

  // Get migration operations by comparing schemas
  const operations = getMigrationOperations(before, after)

  // Convert each operation to DDL
  for (const operation of operations) {
    const result = postgresqlMigrationOperationDeparser(operation)

    if (result.value) {
      ddlStatements.push(result.value)
    }

    if (result.errors.length > 0) {
      errors.push(...result.errors)
    }
  }

  // Combine all DDL statements
  const combinedDDL = ddlStatements.join('\n\n')

  return {
    value: combinedDDL,
    errors,
  }
}
