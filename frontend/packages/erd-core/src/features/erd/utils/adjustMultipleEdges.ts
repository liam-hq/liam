import type { Edge } from '@xyflow/react'

/**
 * Adjusts edges between the same source and target nodes to prevent overlap
 * by adding curvature offsets
 */
export const adjustMultipleEdges = (edges: Edge[]): Edge[] => {
  // Group edges by source-target pair
  const edgeGroups = new Map<string, Edge[]>()

  edges.forEach((edge) => {
    const key = `${edge.source}-${edge.target}`
    const group = edgeGroups.get(key) || []
    group.push(edge)
    edgeGroups.set(key, group)
  })

  // Adjust edges that have multiple connections between same nodes
  return edges.map((edge) => {
    const key = `${edge.source}-${edge.target}`
    const group = edgeGroups.get(key) || []

    if (group.length <= 1) {
      return edge
    }

    // Find the index of this edge in the group
    const index = group.findIndex((e) => e.id === edge.id)

    // Calculate offset based on position in group
    // Center the edges around 0 offset
    const totalEdges = group.length
    const offset = (index - (totalEdges - 1) / 2) * 50 // 50px spacing between edges

    return {
      ...edge,
      data: {
        ...edge.data,
        // Add offset to be used in edge rendering
        pathOffset: offset,
        edgeIndex: index,
        totalEdgesInGroup: totalEdges,
      },
    }
  })
}
