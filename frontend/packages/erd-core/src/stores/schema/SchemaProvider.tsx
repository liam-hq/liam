import type { FC, PropsWithChildren } from 'react'
import { SchemaContext } from './context'
import type { SchemaStore } from './schema'

type Props = PropsWithChildren & {
  schema: SchemaStore
}

export const SchemaProvider: FC<Props> = ({ children, schema }) => {
  return (
    <SchemaContext.Provider value={schema}>{children}</SchemaContext.Provider>
  )
}
