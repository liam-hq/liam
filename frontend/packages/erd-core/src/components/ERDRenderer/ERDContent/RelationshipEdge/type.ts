import type { Cardinality } from '@liam-hq/db-structure'
import type { Edge } from '@xyflow/react'

export type Data = {
  isHighlighted: boolean
  cardinality: Cardinality | undefined
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
