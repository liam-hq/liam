import type { Edge, Node } from '@xyflow/react'
import type { ElkNode, LayoutOptions } from 'elkjs'
import ELK from 'elkjs/lib/elk.bundled.js'
import { convertElkEdgesToEdges } from './convertElkEdgesToEdges'
import { convertElkNodesToNodes } from './convertElkNodesToNodes'
import { convertNodesToElkNodes } from './convertNodesToElkNodes'

const elk = new ELK()
const layoutOptions: LayoutOptions = {
  'elk.algorithm': 'org.eclipse.elk.force',
  'elk.force.model': 'EADES',
  'elk.force.repulsion': '2',
  'elk.force.iterations': '500',
  'elk.spacing.nodeNode': '20',
  'elk.force.repulsivePower': '4',
}

type Params = {
  nodes: Node[]
  edges: Edge[]
}

export async function getElkLayout({ nodes, edges }: Params): Promise<Params> {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions,
    children: convertNodesToElkNodes(nodes),
    edges: edges.map(({ id, source, target }) => ({
      id,
      sources: [source],
      targets: [target],
    })),
  }

  const layout = await elk.layout(graph)
  if (!layout.children) {
    return {
      nodes,
      edges,
    }
  }

  return {
    nodes: convertElkNodesToNodes(layout.children, nodes),
    edges: convertElkEdgesToEdges(layout.edges ?? [], edges),
  }
}
