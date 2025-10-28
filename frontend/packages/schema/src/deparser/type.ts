import type { Result } from '@liam-hq/neverthrow'
import type { Operation } from '../operation/schema/index.js'
import type { Schema } from '../schema/index.js'

// Legacy types - TODO: Migrate all implementations to use the new types
type DeparserError = {
  message: string
}

type LegacyDeparserResult = {
  value: string
  errors: DeparserError[]
}

/**
 * @deprecated Use SchemaDeparser instead. This type is kept for backward compatibility.
 * TODO: Migrate existing implementations to use the new SchemaDeparser type.
 */
export type LegacySchemaDeparser = (schema: Schema) => LegacyDeparserResult

/**
 * @deprecated Use OperationDeparser instead. This type is kept for backward compatibility.
 * TODO: Migrate existing implementations to use the new OperationDeparser type.
 */
export type LegacyOperationDeparser = (
  operation: Operation,
) => LegacyDeparserResult

// New types using neverthrow
export type SchemaDeparser = (schema: Schema) => Result<string, Error>
export type OperationDeparser = (operation: Operation) => Result<string, Error>
