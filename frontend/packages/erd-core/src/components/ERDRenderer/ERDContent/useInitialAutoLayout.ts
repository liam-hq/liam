import { useCustomReactflow } from '@/features/reactflow/hooks'
import {
  addHiddenNodeIds,
  updateActiveTableName,
  updateShowMode,
} from '@/stores'
import {
  getActiveTableNameFromUrl,
  getHiddenNodeIdsFromUrl,
  getShowModeFromUrl,
} from '@/utils'
import { type Node, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useERDContentContext } from './ERDContentContext'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'

export const useInitialAutoLayout = (
  nodes: Node[],
  shouldFitViewToActiveTable: boolean,
) => {
  const [initializeComplete, setInitializeComplete] = useState(false)

  const tableNodesInitialized = useMemo(
    () =>
      nodes
        .filter((node) => node.type === 'table')
        .some((node) => node.measured),
    [nodes],
  )
  const { getEdges, setNodes, setEdges } = useReactFlow()
  const { fitView } = useCustomReactflow()
  const {
    actions: { setLoading },
  } = useERDContentContext()

  const initialize = useCallback(async () => {
    if (initializeComplete) {
      return
    }

    const activeTableName = getActiveTableNameFromUrl()
    updateActiveTableName(activeTableName)

    const hiddenNodeIds = await getHiddenNodeIdsFromUrl()
    addHiddenNodeIds(hiddenNodeIds)

    const showMode = getShowModeFromUrl()
    updateShowMode(showMode)

    if (tableNodesInitialized) {
      setLoading(true)
      const updatedNodes = nodes.map((node) => ({
        ...node,
        hidden: hiddenNodeIds.includes(node.id),
      }))

      const { nodes: highlightedNodes, edges: highlightedEdges } =
        highlightNodesAndEdges(updatedNodes, getEdges(), {
          activeTableName,
        })

      setNodes(highlightedNodes)
      setEdges(highlightedEdges)

      const fitViewOptions =
        shouldFitViewToActiveTable && activeTableName
          ? { maxZoom: 1, duration: 300, nodes: [{ id: activeTableName }] }
          : { duration: 0 }
      await fitView(fitViewOptions)

      setInitializeComplete(true)
      setLoading(false)
    }
  }, [
    nodes,
    getEdges,
    setNodes,
    setEdges,
    setLoading,
    fitView,
    initializeComplete,
    tableNodesInitialized,
    shouldFitViewToActiveTable,
  ])

  useEffect(() => {
    initialize()
  }, [initialize])
}
