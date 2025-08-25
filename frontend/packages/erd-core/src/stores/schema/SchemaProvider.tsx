import {
  getOperations,
  mergeSchemas,
  type Schema,
  schemaSchema,
} from '@liam-hq/schema'
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
      enums: {},
    }
    const operations = getOperations(previous ?? emptySchema, current)
    const merged = previous ? mergeSchemas(previous, current) : current

    return {
      current,
      previous,
      merged,
      operations,
    }
  }, [current, previous])

  return (
    <SchemaContext.Provider value={computedSchema}>
      {children}
    </SchemaContext.Provider>
  )
}
