import { buildSchemaDiff } from '@liam-hq/db-structure'
import type { FC, PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { SchemaContext } from './context'
import type { SchemaContextValue, SchemaProviderValue } from './schema'

type Props = PropsWithChildren & SchemaProviderValue

export const SchemaProvider: FC<Props> = ({ children, current, previous }) => {
  const computedSchema: SchemaContextValue = useMemo(() => {
    const diffItems =
      current && previous ? buildSchemaDiff(previous, current) : undefined

    return {
      current,
      previous,
      diffItems,
    }
  }, [current, previous])

  return (
    <SchemaContext.Provider value={computedSchema}>
      {children}
    </SchemaContext.Provider>
  )
}
