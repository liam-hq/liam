import type { Edge } from '@xyflow/react'

type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY'

type Data = {
  isHighlighted: boolean
  cardinality: Cardinality
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
