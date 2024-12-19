import type { Node } from '@xyflow/react'
import type { ElkNode } from 'elkjs'

export function convertNodesToElkNodes(nodes: Node[]): ElkNode[] {
  const nodeMap: Record<string, ElkNode> = {}

  const elkNodes: ElkNode[] = []
  for (const node of nodes) {
    const elkNode: ElkNode = {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
      layoutOptions: {
        /**
         * NOTE
         * For NonRelatedTableGroup Nodes, arrange child Nodes in a vertical layout.
         * For all other cases, use default values.
         */
        'elk.aspectRatio':
          node.type === 'nonRelatedTableGroup' ? '0.5625' : '1.6f',
      },
    }
    nodeMap[node.id] = elkNode

    if (node.parentId) {
      const parentNode = nodeMap[node.parentId]
      if (!parentNode) continue

      if (!parentNode.children) {
        parentNode.children = []
      }

      parentNode.children.push(elkNode)
    } else {
      elkNodes.push(elkNode)
    }
  }

  return elkNodes
}
