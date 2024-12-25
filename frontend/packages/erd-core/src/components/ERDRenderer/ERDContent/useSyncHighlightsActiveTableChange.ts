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
    console.info(
      'useSyncHighlightsActiveTableChange - start',
      new Date().toISOString().slice(11, -1),
      initializeComplete,
      tableName,
    )
    if (!initializeComplete) {
      return
    }

    const nodes = getNodes()
    console.info(nodes)
    console.info(nodes[1]?.position)
    if (nodes.some((node) => node.position.x !== 0 || node.position.y !== 0)) {
    } else {
      console.warn('Nodes are not initialized yet')
    }
    const edges = getEdges()
    const { nodes: updatedNodes, edges: updatedEdges } = highlightNodesAndEdges(
      nodes,
      edges,
      { activeTableName: tableName },
    )

    setEdges(updatedEdges)
    setNodes(updatedNodes)
    console.info(
      'useSyncHighlightsActiveTableChange - finish',
      new Date().toISOString().slice(11, -1),
      initializeComplete,
      tableName,
    )
  }, [initializeComplete, tableName, getNodes, getEdges, setNodes, setEdges])
}
