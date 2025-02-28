import type { Cardinality } from '@liam-hq/db-structure'
import type { Edge } from '@xyflow/react'

export type Data = {
  isHighlighted: boolean
  cardinality: Cardinality
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
