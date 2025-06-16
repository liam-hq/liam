import { useContext } from 'react'
import { SchemaContext } from './context'

export const useSchema = () => {
  const schema = useContext(SchemaContext)
  if (!schema) throw new Error('useSchema must be used within SchemaProvider')

  return schema
}
