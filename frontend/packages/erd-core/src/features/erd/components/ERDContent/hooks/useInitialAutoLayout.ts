import type { DisplayArea } from '@/features/erd/types'
import { computeAutoLayout, highlightNodesAndEdges } from '@/features/erd/utils'
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
import type { Node } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useERDContentContext } from '../ERDContentContext'

type Params = {
  nodes: Node[]
  displayArea: DisplayArea
}

export const useInitialAutoLayout = ({ nodes, displayArea }: Params) => {
  const [initializeComplete, setInitializeComplete] = useState(false)

  const tableNodesInitialized = useMemo(
    () =>
      nodes
        .filter((node) => node.type === 'table')
        .some((node) => node.measured),
    [nodes],
  )
  const { getEdges, setNodes, setEdges, fitView } = useCustomReactflow()
  const {
    actions: { setLoading },
  } = useERDContentContext()

  const initialize = useCallback(async () => {
    if (initializeComplete) {
      return
    }

    const activeTableName = getActiveTableNameFromUrl()
    updateActiveTableName(activeTableName)

    const hiddenNodeIds: string[] = []
    if (displayArea === 'main') {
      hiddenNodeIds.push(...(await getHiddenNodeIdsFromUrl()))
      addHiddenNodeIds(hiddenNodeIds)

      const showMode = getShowModeFromUrl()
      updateShowMode(showMode)
    }

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
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        await computeAutoLayout(highlightedNodes, highlightedEdges)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)

      const fitViewOptions =
        displayArea === 'main' && activeTableName
          ? { maxZoom: 1, duration: 300, nodes: [{ id: activeTableName }] }
          : { duration: 0 }
      await fitView(fitViewOptions)

      setInitializeComplete(true)
      setLoading(false)
    }
  }, [
    nodes,
    displayArea,
    getEdges,
    setNodes,
    setEdges,
    setLoading,
    fitView,
    initializeComplete,
    tableNodesInitialized,
  ])

  useEffect(() => {
    initialize()
  }, [initialize])
}
