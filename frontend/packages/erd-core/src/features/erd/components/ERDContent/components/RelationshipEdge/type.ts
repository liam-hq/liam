import type { Cardinality } from '@liam-hq/db-structure'
import type { Edge } from '@xyflow/react'

type Data = {
  isHighlighted: boolean
  cardinality: Cardinality
  pathOffset?: number
  edgeIndex?: number
  totalEdgesInGroup?: number
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
