import type { TableNodeType } from '@/features/erd/types'
import type { ShowMode } from '@/schemas/showMode'
import { userEditingStore } from './store'

export const updateIsPopstateInProgress = (isPopstateInProgress: boolean) => {
  userEditingStore.isPopstateInProgress = isPopstateInProgress
}

export const updateActiveTableName = (tableName: string | undefined) => {
  userEditingStore.active.tableName = tableName
}

export const resetSelectedNodeIds = () => {
  userEditingStore.selectedNodeIds.clear()
}

const handleShiftSelection = (
  nodeId: string,
  nodeIds: string[],
  selectedIds: Set<string>,
) => {
  if (selectedIds.size === 0) {
    selectedIds.add(nodeId)
  } else {
    const lastSelectedId = Array.from(selectedIds).pop()
    if (!lastSelectedId) return
    const lastIndex = nodeIds.indexOf(lastSelectedId)
    const currentIndex = nodeIds.indexOf(nodeId)

    if (lastIndex === -1 || currentIndex === -1) return

    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)

    for (let i = start; i <= end; i++) {
      const id = nodeIds[i]
      if (typeof id === 'string') {
        selectedIds.add(id)
      }
    }
  }
}

const handleCtrlSelection = (nodeId: string, selectedIds: Set<string>) => {
  selectedIds.has(nodeId) ? selectedIds.delete(nodeId) : selectedIds.add(nodeId)
}

const handleSingleSelection = (nodeId: string) => {
  userEditingStore.selectedNodeIds = new Set([nodeId])
}

export const updateSelectedNodeIds = (
  nodeId: string,
  isMultiSelect: 'ctrl' | 'shift' | 'single',
  nodes: TableNodeType[],
) => {
  const nodeIds = nodes.map((node) => node.id)
  const selectedIds = userEditingStore.selectedNodeIds

  if (isMultiSelect === 'shift') {
    handleShiftSelection(nodeId, nodeIds, selectedIds)
  } else if (isMultiSelect === 'ctrl') {
    handleCtrlSelection(nodeId, selectedIds)
  } else {
    handleSingleSelection(nodeId)
  }
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
