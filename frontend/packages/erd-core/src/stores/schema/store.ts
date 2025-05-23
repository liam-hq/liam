import type { Schema } from '@liam-hq/db-structure'
import { proxy } from 'valtio'

export type SchemaStoreType = {
  current: Schema
  previous?: Schema
}

export const schemaStore = proxy<SchemaStoreType>({
  current: {
    tables: {},
    relationships: {},
    tableGroups: {},
  },
})
