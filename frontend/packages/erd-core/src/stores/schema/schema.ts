import { schemaDiffItemsSchema, schemaSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'

const schemaStoreSchema = v.object({
  current: schemaSchema,
  previous: v.optional(schemaSchema),
  diffItems: v.optional(schemaDiffItemsSchema),
})

export type SchemaStore = v.InferOutput<typeof schemaStoreSchema>
