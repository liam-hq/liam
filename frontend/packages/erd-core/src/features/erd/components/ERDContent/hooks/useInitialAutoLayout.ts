import type { Node } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DisplayArea } from '@/features/erd/types'
import { computeAutoLayout, highlightNodesAndEdges } from '@/features/erd/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useUserEditingOrThrow } from '@/stores'
import { useErdContentContext } from '../ErdContentContext'
import { hasNonRelatedChildNodes, updateNodesHiddenState } from '../utils'

type Params = {
  nodes: Node[]
  displayArea: DisplayArea
}

export const useInitialAutoLayout = ({ nodes, displayArea }: Params) => {
  const { activeTableName, hiddenNodeIds } = useUserEditingOrThrow()
  const { getEdges, setNodes, setEdges, fitView } = useCustomReactflow()
  const {
    actions: { setLoading },
  } = useErdContentContext()

  const [initializeComplete, setInitializeComplete] = useState(false)

  const tableNodesInitialized = useMemo(() => {
    return nodes
      .filter((node) => node.type === 'table')
      .some((node) => node.measured)
  }, [nodes])

  const initialize = useCallback(async () => {
    if (initializeComplete) {
      return
    }

    if (tableNodesInitialized) {
      setLoading(true)

      const updateNodes =
        displayArea === 'main'
          ? updateNodesHiddenState({
              nodes,
              hiddenNodeIds,
              shouldHideGroupNodeId: !hasNonRelatedChildNodes(nodes),
            })
          : nodes
      const { nodes: highlightedNodes, edges: highlightedEdges } =
        highlightNodesAndEdges(updateNodes, getEdges(), {
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
      fitView(fitViewOptions)

      setInitializeComplete(true)
      setLoading(false)
    }
  }, [
    initializeComplete,
    tableNodesInitialized,
    activeTableName,
    displayArea,
    hiddenNodeIds,
    nodes,
    getEdges,
    setNodes,
    setEdges,
    setLoading,
    fitView,
  ])

  useEffect(() => {
    initialize()
  }, [initialize])
}
