import type { DBStructure } from '@liam-hq/db-structure'
import { useSnapshot } from 'valtio'
import { dbStructureStore } from './store'

export const useDBStructureStore = () =>
  useSnapshot(dbStructureStore) as DBStructure
