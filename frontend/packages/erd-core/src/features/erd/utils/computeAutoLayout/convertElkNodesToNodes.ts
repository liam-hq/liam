import type { Node } from '@xyflow/react'
import type { ElkNode } from 'elkjs'

export function convertElkNodesToNodes(
  elkNodes: ElkNode[],
  originNodes: Node[],
): Node[] {
  const nodes: Node[] = []
  for (const elkNode of elkNodes) {
    const originNode = originNodes.find((node) => node.id === elkNode.id)
    if (!originNode) continue

    nodes.push({
      ...originNode,
      position: {
        x: elkNode.x ?? 0,
        y: elkNode.y ?? 0,
      },
      width: elkNode.width ?? 0,
      height: elkNode.height ?? 0,
    })

    if (elkNode.children) {
      for (const child of elkNode.children) {
        nodes.push(...convertElkNodesToNodes([child], originNodes))
      }
    }
  }

  return nodes
}
