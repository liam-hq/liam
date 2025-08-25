import type { Cardinality } from '@liam-hq/schema'
import type { Edge } from '@xyflow/react'

type Data = {
  isHighlighted: boolean
  cardinality: Cardinality
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
