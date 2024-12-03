import type { DBStructure } from '@liam-hq/db-structure'
import { deepClone } from 'valtio/utils'
import { dbStructureStore } from './store'

export const initDBStructureStore = (dbStructure: DBStructure) => {
  for (const key of Object.keys(dbStructure)) {
    // @ts-expect-error ... for (const value of Object.keys(obj)) is not typed
    dbStructureStore[key] = deepClone(dbStructure[key])
  }
}
