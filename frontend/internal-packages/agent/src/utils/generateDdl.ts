import { postgresqlSchemaDeparser, type Schema } from '@liam-hq/schema'

/**
 * Generate DDL statements from schema data
 * Returns undefined if there are errors in DDL generation
 */
export const generateDdlFromSchema = (schema: Schema): string | undefined => {
  const result = postgresqlSchemaDeparser(schema)
  return result.errors.length > 0 ? undefined : result.value
}
