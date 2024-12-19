import { userEditingStore } from './store'

export const updateActiveTableName = (tableName: string | undefined) => {
  userEditingStore.active.tableName = tableName
}
