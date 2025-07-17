import { err, ok, type Result } from 'neverthrow'
import { useContext } from 'react'
import { SchemaContext, type SchemaContextValue } from './context'

const useSchema = (): Result<SchemaContextValue, Error> => {
  const schema = useContext(SchemaContext)
  if (!schema)
    return err(new Error('useSchema must be used within SchemaProvider'))

  return ok(schema)
}

export const useSchemaOrThrow = (): SchemaContextValue => {
  const result = useSchema()
  if (result.isErr()) {
    throw result.error
  }
  return result.value
}
