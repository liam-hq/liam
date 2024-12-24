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
