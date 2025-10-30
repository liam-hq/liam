import {
  getMigrationOperations,
  mergeSchemas,
  type Schema,
  schemaSchema,
} from '@liam-hq/schema'
import { type FC, type PropsWithChildren, useMemo } from 'react'
import * as v from 'valibot'
import { SchemaContext, type SchemaContextValue } from './context'

const schemaProviderSchema = v.object({
  current: schemaSchema,
  baseline: v.optional(schemaSchema),
})

export type SchemaProviderValue = v.InferOutput<typeof schemaProviderSchema>

type Props = PropsWithChildren & SchemaProviderValue

export const SchemaProvider: FC<Props> = ({ children, current, baseline }) => {
  const computedSchema: SchemaContextValue = useMemo(() => {
    const emptySchema: Schema = {
      tables: {},
      enums: {},
      extensions: {},
    }
    const operations = getMigrationOperations(baseline ?? emptySchema, current)
    const merged = baseline ? mergeSchemas(baseline, current) : current

    return {
      current,
      baseline,
      merged,
      operations,
    }
  }, [current, baseline])

  return (
    <SchemaContext.Provider value={computedSchema}>
      {children}
    </SchemaContext.Provider>
  )
}
