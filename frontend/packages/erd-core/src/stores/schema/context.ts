import { schemaDiffItemsSchema, schemaSchema } from '@liam-hq/db-structure'
import { createContext } from 'react'
import * as v from 'valibot'

const schemaStoreSchema = v.object({
  current: schemaSchema,
  previous: v.optional(schemaSchema),
  diffItems: v.optional(schemaDiffItemsSchema),
})

export type SchemaContextValue = v.InferOutput<typeof schemaStoreSchema>

export const SchemaContext = createContext<SchemaContextValue | null>(null)
