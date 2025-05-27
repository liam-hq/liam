import type { ShowMode } from '@/schemas/showMode'
import { userEditingStore } from './store'

export const updateIsPopstateInProgress = (isPopstateInProgress: boolean) => {
  userEditingStore.isPopstateInProgress = isPopstateInProgress
}

export const updateActiveTableName = (tableName: string | undefined) => {
  userEditingStore.active.tableName = tableName
}

export const updateShowMode = (showMode: ShowMode) => {
  userEditingStore.showMode = showMode
}

export const toggleHiddenNodeId = (nodeId: string) => {
  if (userEditingStore.hiddenNodeIds.has(nodeId)) {
    userEditingStore.hiddenNodeIds.delete(nodeId)
  } else {
    userEditingStore.hiddenNodeIds.add(nodeId)
  }
}

export const addHiddenNodeIds = (nodeIds: string[]) => {
  for (const id of nodeIds) {
    userEditingStore.hiddenNodeIds.add(id)
  }
}

export const replaceHiddenNodeIds = (nodeIds: string[]) => {
  userEditingStore.hiddenNodeIds.clear()
  addHiddenNodeIds(nodeIds)
}
