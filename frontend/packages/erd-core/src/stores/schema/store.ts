import { proxy } from 'valtio'
import type { SchemaStore } from './schema'

export const schemaStore = proxy<SchemaStore>({
  current: {
    tables: {},
    relationships: {},
    tableGroups: {},
  },
  previous: {
    tables: {},
    relationships: {},
    tableGroups: {},
  },
  diffItems: [],
})
