import { useUserEditingStore } from '@/stores'
import { useUserEditingActiveStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import type { Edge, FitViewOptions, Node } from '@xyflow/react'
import { useCallback } from 'react'
import { useERDContentContext } from '../ERDContentContext'
import { highlightNodesAndEdges } from '../highlightNodesAndEdges'
import { getElkLayout } from './getElkLayout'

export const useAutoLayout = () => {
  const { setNodes, fitView } = useReactFlow()
  const {
    state: { autoLayoutComplete },
    actions: { setLoading, setInitializeComplete, setAutoLayoutComplete },
  } = useERDContentContext()
  const { hiddenNodeIds } = useUserEditingStore()
  const { tableName } = useUserEditingActiveStore()

  const handleLayout = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      fitViewOptions: FitViewOptions = {},
    ) => {
      setLoading(true)

      let newNodes: Node[]

      newNodes = nodes.map((node) => {
        const hidden = hiddenNodeIds.has(node.id)
        return { ...node, hidden }
      })
      setInitializeComplete(true)

      const hiddenNodes: Node[] = []
      const visibleNodes: Node[] = []
      for (const node of newNodes) {
        if (node.hidden) {
          hiddenNodes.push(node)
        } else {
          visibleNodes.push(node)
        }
      }
      // NOTE: Only include edges where both the source and target are in the nodes
      const nodeMap = new Map(visibleNodes.map((node) => [node.id, node]))
      const visibleEdges = edges.filter((edge) => {
        return nodeMap.get(edge.source) && nodeMap.get(edge.target)
      })

      const { nodes: visibleNodes2, edges: visibleEdges2 } =
        highlightNodesAndEdges(visibleNodes, visibleEdges, {
          activeTableName: tableName,
        })

      let visibleNodes3: Node[]
      if (!autoLayoutComplete) {
        const autoLayoutedVisibleNodes = await getElkLayout({
          nodes: visibleNodes2,
          edges: visibleEdges2,
        })
        visibleNodes3 = autoLayoutedVisibleNodes
        setAutoLayoutComplete(true)
      } else {
        visibleNodes3 = visibleNodes
      }

      setNodes([...hiddenNodes, ...visibleNodes3])

      // temporary comment
      // - Chrome seems to love setTimeout
      // - Safari seems to love window.requestAnimationFrame
      // TODO: Investigate which one is better
      setTimeout(() => {
        window.requestAnimationFrame(() => {
          fitView(fitViewOptions)
          setLoading(false)
        })
      }, 0)
    },
    [
      hiddenNodeIds,
      tableName,
      autoLayoutComplete,
      setNodes,
      fitView,
      setLoading,
      setInitializeComplete,
      setAutoLayoutComplete,
    ],
  )

  return { handleLayout }
}
