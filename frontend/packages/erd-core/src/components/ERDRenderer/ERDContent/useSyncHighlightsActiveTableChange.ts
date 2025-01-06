import { useUserEditingActiveStore } from '@/stores'
import { useEffect } from 'react'
import { useNodesContext } from '../../../providers/NodesProvider'
import { useERDContentContext } from './ERDContentContext'
import { highlightNodesAndEdges } from './highlightNodesAndEdges'

export const useSyncHighlightsActiveTableChange = () => {
  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { nodes, edges, setNodes, setEdges } = useNodesContext()
  const { tableName } = useUserEditingActiveStore()

  useEffect(() => {
    if (!initializeComplete) {
      return
    }

    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      { activeTableName: tableName },
    )

    const shouldUpdateNodes = nodes.some((node, index) => {
      const updatedNode = updatedNodes[index]
      return JSON.stringify(node.data) !== JSON.stringify(updatedNode?.data)
    })

    if (shouldUpdateNodes) {
      setNodes({
        type: 'UPDATE_DATA',
        payload: updatedNodes,
      })
    }

    const shouldUpdateEdges = edges.some((edge, index) => {
      const updatedEdge = updatedEdges[index]
      return JSON.stringify(edge) !== JSON.stringify(updatedEdge)
    })

    if (shouldUpdateEdges) {
      setEdges({
        type: 'UPDATE_EDGES',
        payload: updatedEdges,
      })
    }
  }, [initializeComplete, tableName, nodes, edges, setNodes, setEdges])
}
