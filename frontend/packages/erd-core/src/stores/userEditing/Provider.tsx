'use client'
import {
  createParser,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs'
import { type FC, type PropsWithChildren, useCallback, useState } from 'react'
import type { TableNodeType } from '@/features/erd/types'
import type { ShowMode } from '@/schemas'
import { UserEditingContext } from './context'

const parseAsStringArray = createParser({
  parse: (value: string): string[] => {
    if (!value) return []
    return value.split(',').filter(Boolean)
  },

  serialize: (value: string[]): string => {
    if (value.length === 0) return ''
    return value.join(',')
  },
})

export const UserEditingProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activeTableName, setActiveTableName] = useQueryState(
    'active',
    parseAsString.withDefault('').withOptions({ history: 'push' }),
  )

  const [showMode, setShowMode] = useQueryState(
    'showMode',
    parseAsStringEnum<ShowMode>(['ALL_FIELDS', 'KEY_ONLY', 'TABLE_NAME'])
      .withDefault('TABLE_NAME')
      .withOptions({
        history: 'push',
      }),
  )

  const [hiddenNodeIds, setHiddenNodeIds] = useQueryState(
    'hidden',
    parseAsStringArray.withDefault([]).withOptions({
      history: 'push',
    }),
  )

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [isPopstateInProgress, setIsPopstateInProgress] = useState(false)
  const [isTableGroupEditMode, setIsTableGroupEditMode] = useState(false)

  const toggleHiddenNodeId = useCallback(
    (nodeId: string) => {
      setHiddenNodeIds((prev) => {
        const newHiddenNodeIds = new Set(prev)

        if (newHiddenNodeIds.has(nodeId)) {
          newHiddenNodeIds.delete(nodeId)
        } else {
          newHiddenNodeIds.add(nodeId)
        }

        return Array.from(newHiddenNodeIds)
      })
    },
    [setHiddenNodeIds],
  )

  const calculateSelectionRange = useCallback(
    (lastSelectedId: string, currentNodeId: string, nodeIds: string[]) => {
      const lastIndex = nodeIds.indexOf(lastSelectedId)
      const currentIndex = nodeIds.indexOf(currentNodeId)

      if (lastIndex === -1 || currentIndex === -1) return null

      return {
        start: Math.min(lastIndex, currentIndex),
        end: Math.max(lastIndex, currentIndex),
      }
    },
    [],
  )

  const addNodesInRange = useCallback(
    (
      selectedIds: Set<string>,
      nodeIds: string[],
      start: number,
      end: number,
    ) => {
      for (let i = start; i <= end; i++) {
        const id = nodeIds[i]
        if (typeof id === 'string') {
          selectedIds.add(id)
        }
      }
    },
    [],
  )

  const handleShiftSelection = useCallback(
    (nodeId: string, nodeIds: string[], currentSelectedIds: Set<string>) => {
      const newSelectedIds = new Set(currentSelectedIds)

      if (newSelectedIds.size === 0) {
        newSelectedIds.add(nodeId)
        setSelectedNodeIds(newSelectedIds)
        return
      }

      const lastSelectedId = Array.from(newSelectedIds).pop()
      if (!lastSelectedId) return

      const range = calculateSelectionRange(lastSelectedId, nodeId, nodeIds)
      if (!range) return

      addNodesInRange(newSelectedIds, nodeIds, range.start, range.end)
      setSelectedNodeIds(newSelectedIds)
    },
    [calculateSelectionRange, addNodesInRange],
  )

  const handleCtrlSelection = useCallback(
    (nodeId: string, currentSelectedIds: Set<string>) => {
      const newSelectedIds = new Set(currentSelectedIds)

      if (newSelectedIds.has(nodeId)) {
        newSelectedIds.delete(nodeId)
      } else {
        newSelectedIds.add(nodeId)
      }

      setSelectedNodeIds(newSelectedIds)
    },
    [],
  )

  const handleSingleSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds(new Set([nodeId]))
  }, [])

  const updateSelectedNodeIds = useCallback(
    (
      nodeId: string,
      isMultiSelect: 'ctrl' | 'shift' | 'single',
      nodes: TableNodeType[],
    ) => {
      const nodeIds = nodes.map((node) => node.id)

      if (isMultiSelect === 'shift') {
        handleShiftSelection(nodeId, nodeIds, selectedNodeIds)
      } else if (isMultiSelect === 'ctrl') {
        handleCtrlSelection(nodeId, selectedNodeIds)
      } else {
        handleSingleSelection(nodeId)
      }
    },
    [
      handleShiftSelection,
      handleCtrlSelection,
      handleSingleSelection,
      selectedNodeIds,
    ],
  )

  const resetSelectedNodeIds = useCallback(() => {
    setSelectedNodeIds(new Set())
  }, [])

  return (
    <UserEditingContext.Provider
      value={{
        // URL synchronized state
        activeTableName,
        setActiveTableName,
        showMode,
        setShowMode,
        hiddenNodeIds,
        setHiddenNodeIds,
        toggleHiddenNodeId,
        // Local state
        selectedNodeIds,
        updateSelectedNodeIds,
        resetSelectedNodeIds,
        isPopstateInProgress,
        setIsPopstateInProgress,
        isTableGroupEditMode,
        setIsTableGroupEditMode,
      }}
    >
      {children}
    </UserEditingContext.Provider>
  )
}
