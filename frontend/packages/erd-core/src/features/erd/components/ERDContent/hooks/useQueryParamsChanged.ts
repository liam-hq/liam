import type { DisplayArea } from '@/features/erd/types'
import { computeAutoLayout, highlightNodesAndEdges } from '@/features/erd/utils'
import { useUserEditing } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { useCallback, useEffect } from 'react'
import { hasNonRelatedChildNodes, updateNodesHiddenState } from '../utils'
import { usePopStateListener } from './usePopStateListener'
type Params = {
  displayArea: DisplayArea
}

export const useQueryParamsChanged = ({ displayArea }: Params) => {
  usePopStateListener()

  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow()
  const { activeTableName, hiddenNodeIds, showMode, isPopstateInProgress } =
    useUserEditing()

  const handleChangeQueryParams = useCallback(async () => {
    // NOTE: Only execute layout calculation during browser navigation
    if (!isPopstateInProgress) return

    const nodes = getNodes()

    const updatedNodes = updateNodesHiddenState({
      nodes,
      hiddenNodeIds,
      shouldHideGroupNodeId: !hasNonRelatedChildNodes(nodes),
    })

    const { nodes: highlightedNodes, edges: highlightedEdges } =
      highlightNodesAndEdges(updatedNodes, getEdges(), {
        activeTableName: activeTableName ?? undefined,
      })
    const { nodes: layoutedNodes, edges: layoutedEdges } =
      await computeAutoLayout(highlightedNodes, highlightedEdges)

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)

    const fitViewOptions =
      displayArea === 'main' && activeTableName
        ? { maxZoom: 1, duration: 300, nodes: [{ id: activeTableName }] }
        : { duration: 0 }
    await fitView(fitViewOptions)
  }, [
    isPopstateInProgress,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    fitView,
    displayArea,
    activeTableName,
    hiddenNodeIds,
  ])

  useEffect(() => {
    handleChangeQueryParams()
  }, [activeTableName, hiddenNodeIds, showMode, handleChangeQueryParams])
}
