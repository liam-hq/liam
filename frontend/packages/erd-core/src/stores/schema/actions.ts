import { deepClone } from 'valtio/utils'
import { type SchemaStoreType, schemaStore } from './store'

export const initSchemaStore = ({ current, previous }: SchemaStoreType) => {
  for (const key of Object.keys(current)) {
    // @ts-expect-error ... for (const value of Object.keys(obj)) is not typed
    schemaStore.current[key] = deepClone(current[key])
  }

  if (previous === undefined) return
  for (const key of Object.keys(previous)) {
    // @ts-expect-error ... for (const value of Object.keys(obj)) is not typed
    schemaStore.previous[key] = deepClone(previous[key])
  }
}
