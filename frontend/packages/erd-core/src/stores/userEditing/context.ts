import { createContext } from 'react'
import type { TableNodeType } from '@/features/erd/types'
import type { ShowMode } from '@/schemas'

export type UserEditingContextValue = {
  // URL synchronized state
  activeTableName: string | null
  setActiveTableName: (tableName: string | null) => void

  showMode: ShowMode
  setShowMode: (showMode: ShowMode | null) => void

  hiddenNodeIds: string[]
  setHiddenNodeIds: (nodeIds: string[] | null) => void
  toggleHiddenNodeId: (nodeId: string) => void

  // Local state
  selectedNodeIds: Set<string>
  updateSelectedNodeIds: (
    nodeId: string,
    isMultiSelect: 'ctrl' | 'shift' | 'single',
    nodes: TableNodeType[],
  ) => void
  resetSelectedNodeIds: () => void
  isPopstateInProgress: boolean
  setIsPopstateInProgress: (isPopstateInProgress: boolean) => void
  showDiff: boolean
  setShowDiff: (showDiff: boolean) => void
}

export const UserEditingContext = createContext<UserEditingContextValue | null>(
  null,
)
