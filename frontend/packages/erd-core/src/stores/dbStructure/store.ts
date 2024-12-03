import type { DBStructure } from '@liam-hq/db-structure'
import { proxy } from 'valtio'

export const dbStructureStore = proxy<DBStructure>({
  tables: {},
  relationships: {},
})
