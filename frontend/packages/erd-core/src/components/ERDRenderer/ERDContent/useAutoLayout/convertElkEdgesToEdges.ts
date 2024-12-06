import type { Edge } from '@xyflow/react'
import type { ElkExtendedEdge } from 'elkjs'

export function convertElkEdgesToEdges(
  elkEdges: ElkExtendedEdge[],
  originEdges: Edge[],
): Edge[] {
  const results: Edge[] = []

  for (const { id, sources, targets } of elkEdges) {
    const originEdge = originEdges.find((edge) => edge.id === id)
    if (!originEdge) continue

    results.push({
      ...originEdge,
      source: sources[0] ?? '',
      target: targets[0] ?? '',
      zIndex: 1,
      style: {
        opacity: 1,
      },
    })
  }

  return results
}
