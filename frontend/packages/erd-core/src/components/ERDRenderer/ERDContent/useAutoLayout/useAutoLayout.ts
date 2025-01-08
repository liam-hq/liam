import { useUserEditingStore } from '@/stores'
import { useUserEditingActiveStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import type { Edge, FitViewOptions, Node } from '@xyflow/react'
import { useCallback } from 'react'
import { NON_RELATED_TABLE_GROUP_NODE_ID } from '../../convertDBStructureToNodes'
import { useERDContentContext } from '../ERDContentContext'
import { highlightNodesAndEdges } from '../highlightNodesAndEdges'
import { getElkLayout } from './getElkLayout'

const updateNodeVisibility = (
  nodes: Node[],
  hiddenNodeIds: Set<string>,
): Node[] =>
  nodes.map((node) => ({ ...node, hidden: hiddenNodeIds.has(node.id) }))

const updateNonRelatedTableGroupNode = (nodes: Node[]): Node[] => {
  const hasVisibleChildren = nodes.some(
    (child) =>
      child.parentId === NON_RELATED_TABLE_GROUP_NODE_ID && !child.hidden,
  )

  if (hasVisibleChildren) {
    return nodes.map((node) => {
      if (node.id === NON_RELATED_TABLE_GROUP_NODE_ID) {
        node.hidden = false
      }
      return node
    })
  }
  return nodes
}

const classifyNodes = (nodes: Node[]): { hidden: Node[]; visible: Node[] } => {
  const hidden: Node[] = []
  const visible: Node[] = []

  for (const node of nodes) {
    node.hidden ? hidden.push(node) : visible.push(node)
  }

  return { hidden, visible }
}

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
      setInitializeComplete(true)

      // Update node visibility
      const updatedNodes = updateNodeVisibility(nodes, hiddenNodeIds)

      // Classify nodes into hidden and visible
      const { hidden: hiddenNodes, visible: visibleNodes } = classifyNodes(
        updateNonRelatedTableGroupNode(updatedNodes),
      )

      // Filter edges to include only visible nodes
      const visibleNodeMap = new Map(
        visibleNodes.map((node) => [node.id, node]),
      )
      const filteredEdges = edges.filter(
        (edge) =>
          visibleNodeMap.has(edge.source) && visibleNodeMap.has(edge.target),
      )

      // Highlight nodes and edges
      const { nodes: highlightedNodes, edges: highlightedEdges } =
        highlightNodesAndEdges(visibleNodes, filteredEdges, {
          activeTableName: tableName,
        })

      // Perform auto layout if necessary
      const finalVisibleNodes: Node[] = autoLayoutComplete
        ? visibleNodes
        : await getElkLayout({
            nodes: highlightedNodes,
            edges: highlightedEdges,
          })

      setAutoLayoutComplete(true)

      // Update nodes
      setNodes([...hiddenNodes, ...finalVisibleNodes])

      // TODO: Investigate which approach works best. It's possible that both are needed.
      // - Chrome appears to prefer `setTimeout`.
      // - Safari seems to favor `window.requestAnimationFrame`.
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
