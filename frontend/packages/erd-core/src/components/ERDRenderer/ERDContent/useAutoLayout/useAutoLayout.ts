import { useNodesInitialized, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect } from 'react'
import { getElkLayout } from './getElkLayout'

export const useAutoLayout = () => {
  const nodesInitialized = useNodesInitialized()
  const { getNodes, setNodes, getEdges, setEdges, fitView } = useReactFlow()

  const handleLayout = useCallback(async () => {
    const nodes = getNodes()
    const edges = getEdges()

    const { nodes: newNodes, edges: newEdges } = await getElkLayout({
      nodes,
      edges,
    })

    setNodes(newNodes)
    setEdges(newEdges)
    setTimeout(() => fitView(), 0)
  }, [getNodes, setNodes, getEdges, setEdges, fitView])

  useEffect(() => {
    if (nodesInitialized) {
      handleLayout()
    }
  }, [nodesInitialized, handleLayout])
}
