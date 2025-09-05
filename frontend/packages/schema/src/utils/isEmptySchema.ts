import type { Schema } from '../schema'

/**
 * Checks if the schema is empty (no tables, enums, or extensions)
 *
 * @param schema - The schema to check
 * @returns True if the schema contains no tables, enums, or extensions
 */
export const isEmptySchema = (schema: Schema): boolean => {
  return (
    Object.keys(schema.enums || {}).length === 0 &&
    Object.keys(schema.tables || {}).length === 0 &&
    Object.keys(schema.extensions || {}).length === 0
  )
}
