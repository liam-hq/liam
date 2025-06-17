import { schemaDiffItemsSchema, schemaSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'

// Type for Schema Provider (received from external sources, does not include diffItems)
const schemaProviderSchema = v.object({
  current: schemaSchema,
  previous: v.optional(schemaSchema),
})

// Type for Schema Context (used internally, diffItems are automatically calculated)
const schemaContextSchema = v.object({
  current: schemaSchema,
  previous: v.optional(schemaSchema),
  diffItems: v.optional(schemaDiffItemsSchema),
})

export type SchemaProviderValue = v.InferOutput<typeof schemaProviderSchema>
export type SchemaContextValue = v.InferOutput<typeof schemaContextSchema>
