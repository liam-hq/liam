import {
  buildSchemaDiff,
  mergeSchemas,
  type Schema,
  schemaSchema,
} from '@liam-hq/db-structure'
import { type FC, type PropsWithChildren, useMemo } from 'react'
import * as v from 'valibot'
import { SchemaContext, type SchemaContextValue } from './context'

const schemaProviderSchema = v.object({
  current: schemaSchema,
  previous: v.optional(schemaSchema),
})

export type SchemaProviderValue = v.InferOutput<typeof schemaProviderSchema>

type Props = PropsWithChildren & SchemaProviderValue

export const SchemaProvider: FC<Props> = ({ children, current, previous }) => {
  const computedSchema: SchemaContextValue = useMemo(() => {
    const emptySchema: Schema = {
      tables: {},
      relationships: {},
    }
    const diffItems = buildSchemaDiff(previous ?? emptySchema, current)
    const merged = previous ? mergeSchemas(previous, current) : current

    return {
      current,
      previous,
      merged,
      diffItems,
    }
  }, [current, previous])

  return (
    <SchemaContext.Provider value={computedSchema}>
      {children}
    </SchemaContext.Provider>
  )
}
