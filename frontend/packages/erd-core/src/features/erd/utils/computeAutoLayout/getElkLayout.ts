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
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.considerModelOrder.components': 'MODEL_ORDER',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.layered.mergeEdges': 'true',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.nodePlacement.bk.fixedAlignment': 'RIGHTDOWN',
  'elk.layered.layering.strategy': 'LONGEST_PATH',
  'elk.layered.layering.nodePromotion.strategy': 'DUMMYNODE_PERCENTAGE',
  'elk.direction': 'RIGHT',
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
