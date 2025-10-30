import { migrationOperationsSchema, schemaSchema } from '@liam-hq/schema'
import { createContext } from 'react'
import * as v from 'valibot'

const schemaStoreSchema = v.object({
  current: schemaSchema,
  baseline: v.optional(schemaSchema),
  merged: v.optional(schemaSchema),
  operations: v.optional(migrationOperationsSchema),
})

export type SchemaContextValue = v.InferOutput<typeof schemaStoreSchema>

export const SchemaContext = createContext<SchemaContextValue | null>(null)
