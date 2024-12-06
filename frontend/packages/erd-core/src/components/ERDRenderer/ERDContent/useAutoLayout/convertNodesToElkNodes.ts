import type { Node } from '@xyflow/react'
import type { ElkNode } from 'elkjs'

export function convertNodesToElkNodes(nodes: Node[]): ElkNode[] {
  return nodes.map((node) => ({
    ...node,
    width: node.measured?.width ?? 0,
    height: node.measured?.height ?? 0,
  }))
}
