import type { Cardinality } from '@liam-hq/db-structure'
import type { Edge } from '@xyflow/react'

export type Data = {
  isHighlighted: boolean
  cardinality: Cardinality
  // Properties for requested relationships
  isRequested?: boolean
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  request?: any
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  relationship?: any
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>
