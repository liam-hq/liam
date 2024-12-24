import { useUserEditingActiveStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { useEffect } from 'react'
import { useERDContentContext } from './ERDContentContext'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'

export const useSyncHighlightsActiveTableChange = () => {
  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow()
  const { tableName } = useUserEditingActiveStore()

  useEffect(() => {
    if (!initializeComplete) {
      return
    }

    const nodes = getNodes()
    if (
      !nodes.some(
        (node) =>
          node.type === 'table' &&
          node.position.x !== 0 &&
          node.position.y !== 0,
      )
    ) {
      console.warn('nodes are not auto-layouted yet')
      return
    }

    const edges = getEdges()
    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      { activeTableName: tableName },
    )

    setEdges(updatedEdges)
    setNodes(updatedNodes)
  }, [initializeComplete, tableName, getNodes, getEdges, setNodes, setEdges])
}
