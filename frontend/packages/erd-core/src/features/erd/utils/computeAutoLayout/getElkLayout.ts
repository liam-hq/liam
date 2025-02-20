import type { Edge, Node } from '@xyflow/react'
import type { ElkNode, LayoutOptions } from 'elkjs'
import ELK from 'elkjs/lib/elk.bundled.js'
import { convertElkNodesToNodes } from './convertElkNodesToNodes'
import { convertNodesToElkNodes } from './convertNodesToElkNodes'

const elk = new ELK()

const layoutOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.baseValue': '40',
  'elk.spacing.componentComponent': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '120',
  'elk.layered.considerModelOrder.strategy': 'PREFER_EDGES',
  'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
  'elk.layered.mergeEdges': 'true',
  'elk.layered.nodePlacement.strategy': 'INTERACTIVE',
  'elk.layered.layering.strategy': 'INTERACTIVE',
}

type Params = {
  nodes: Node[]
  edges: Edge[]
}

export async function getElkLayout({ nodes, edges }: Params): Promise<Node[]> {
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
    return nodes
  }

  return convertElkNodesToNodes(layout.children, nodes)
}
