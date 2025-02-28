import { zIndex } from '@/features/erd/constants'
import type { Edge, Node } from '@xyflow/react'
import type { TableNodeType } from '../types'
import { isTableNode } from './isTableNode'

type TargetTableName = string
type RelatedTableName = string
type EdgeMap = Map<TargetTableName, Set<RelatedTableName>>

const isActiveNode = (
  activeTableName: string | undefined,
  node: TableNodeType,
): boolean => {
  return node.data.table.name === activeTableName
}

const isRelatedNodeToTarget = (
  targetTableName: string | undefined,
  edgeMap: EdgeMap,
  node: TableNodeType,
): boolean => {
  if (!targetTableName) {
    return false
  }

  return edgeMap.get(targetTableName)?.has(node.data.table.name) ?? false
}

const isHoveredNode = (
  hoverTableName: string | undefined,
  node: TableNodeType,
): boolean => {
  return node.data.table.name === hoverTableName
}

const isRelatedEdgeToTarget = (
  targetTableName: string | undefined,
  edge: Edge,
): boolean => {
  return edge.source === targetTableName || edge.target === targetTableName
}

const activeHighlightNode = (node: TableNodeType): TableNodeType => ({
  ...node,
  data: {
    ...node.data,
    isActiveHighlighted: true,
  },
})

const highlightNode = (node: TableNodeType): TableNodeType => ({
  ...node,
  data: {
    ...node.data,
    isHighlighted: true,
  },
})

const unhighlightNode = (node: TableNodeType): TableNodeType => ({
  ...node,
  data: {
    ...node.data,
    isActiveHighlighted: false,
    isHighlighted: false,
  },
})

const highlightEdge = (edge: Edge): Edge => ({
  ...edge,
  animated: false,
  selectable: false,
  zIndex: zIndex.edgeHighlighted,
  data: { ...edge.data, isHighlighted: true },
})

const unhighlightEdge = (edge: Edge): Edge => ({
  ...edge,
  animated: false,
  selectable: false,
  zIndex: zIndex.edgeDefault,
  data: { ...edge.data, isHighlighted: false },
})

export const highlightNodesAndEdges = (
  nodes: Node[],
  edges: Edge[],
  trigger: {
    activeTableName?: string | undefined
    hoverTableName?: string | undefined
  },
): { nodes: Node[]; edges: Edge[] } => {
  const { activeTableName, hoverTableName } = trigger
  const edgeMap: EdgeMap = new Map()
  for (const edge of edges) {
    const sourceTableName = edge.source
    const targetTableName = edge.target
    if (!edgeMap.has(sourceTableName)) {
      edgeMap.set(sourceTableName, new Set())
    }
    if (!edgeMap.has(targetTableName)) {
      edgeMap.set(targetTableName, new Set())
    }
    edgeMap.get(sourceTableName)?.add(targetTableName)
    edgeMap.get(targetTableName)?.add(sourceTableName)
  }

  const updatedNodes = nodes.map((node) => {
    if (!isTableNode(node)) {
      return node
    }

    if (isActiveNode(activeTableName, node)) {
      return activeHighlightNode(node)
    }

    if (
      isRelatedNodeToTarget(activeTableName, edgeMap, node) ||
      isHoveredNode(hoverTableName, node) ||
      isRelatedNodeToTarget(hoverTableName, edgeMap, node)
    ) {
      return highlightNode(node)
    }

    return unhighlightNode(node)
  })

  const updatedEdges = edges.map((edge) => {
    if (
      isRelatedEdgeToTarget(activeTableName, edge) ||
      isRelatedEdgeToTarget(hoverTableName, edge)
    ) {
      return highlightEdge(edge)
    }

    return unhighlightEdge(edge)
  })

  return { nodes: updatedNodes, edges: updatedEdges }
}
