import type { Edge, Node } from '@xyflow/react'
import { getElkLayout } from './getElkLayout'

export const computeAutoLayout = async (nodes: Node[], edges: Edge[]) => {
  const hiddenNodes: Node[] = []
  const visibleNodes: Node[] = []
  for (const node of nodes) {
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

  const newNodes = await getElkLayout({
    nodes: visibleNodes,
    edges: visibleEdges,
  })

  return {
    nodes: [...hiddenNodes, ...newNodes],
    edges,
  }
}
