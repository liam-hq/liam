import { useSnapshot } from 'valtio'
import { type SchemaStoreType, schemaStore } from './store'

export const useSchemaStore = () => useSnapshot(schemaStore) as SchemaStoreType
