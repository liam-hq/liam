import { describe, expect, it } from 'vitest'
import type { Edge } from '@xyflow/react'
import { adjustMultipleEdges } from './adjustMultipleEdges'

describe('adjustMultipleEdges', () => {
  it('should add offsets to multiple edges between same nodes', () => {
    const edges: Edge[] = [
      {
        id: 'fk_store_region_0',
        source: 'regions',
        target: 'stores',
        type: 'relationship',
      },
      {
        id: 'fk_store_region_1',
        source: 'regions',
        target: 'stores',
        type: 'relationship',
      },
    ]

    const adjustedEdges = adjustMultipleEdges(edges)

    expect(adjustedEdges).toHaveLength(2)
    
    // First edge should have negative offset
    expect(adjustedEdges[0]?.data?.pathOffset).toBe(-50)
    expect(adjustedEdges[0]?.data?.edgeIndex).toBe(0)
    expect(adjustedEdges[0]?.data?.totalEdgesInGroup).toBe(2)
    expect(adjustedEdges[0]?.zIndex).toBe(0)
    
    // Second edge should have positive offset
    expect(adjustedEdges[1]?.data?.pathOffset).toBe(50)
    expect(adjustedEdges[1]?.data?.edgeIndex).toBe(1)
    expect(adjustedEdges[1]?.data?.totalEdgesInGroup).toBe(2)
    expect(adjustedEdges[1]?.zIndex).toBe(1)
  })

  it('should not modify single edges', () => {
    const edges: Edge[] = [
      {
        id: 'single_fk',
        source: 'users',
        target: 'posts',
        type: 'relationship',
      },
    ]

    const adjustedEdges = adjustMultipleEdges(edges)

    expect(adjustedEdges).toHaveLength(1)
    expect(adjustedEdges[0]?.data).toBeUndefined()
    expect(adjustedEdges[0]?.zIndex).toBeUndefined()
  })

  it('should handle edges in opposite directions separately', () => {
    const edges: Edge[] = [
      {
        id: 'fk1',
        source: 'A',
        target: 'B',
        type: 'relationship',
      },
      {
        id: 'fk2',
        source: 'B',
        target: 'A',
        type: 'relationship',
      },
    ]

    const adjustedEdges = adjustMultipleEdges(edges)

    // Edges in opposite directions should not be grouped
    expect(adjustedEdges[0]?.data).toBeUndefined()
    expect(adjustedEdges[1]?.data).toBeUndefined()
  })
})