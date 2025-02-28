import type { Cardinality, Table } from '@liam-hq/db-structure'
import type { Node } from '@xyflow/react'

export type TableNodeData = {
  table: Table
  isActiveHighlighted: boolean
  isHighlighted: boolean
  sourceColumnName: string | undefined
  targetColumnCardinalities?:
    | Record<string, Cardinality | undefined>
    | undefined
}

export type TableNodeType = Node<TableNodeData, 'table'>

export type NonRelatedTableGroupNodeType = Node<
  Record<string, unknown>,
  'nonRelatedTableGroup'
>

export type DisplayArea = 'main' | 'relatedTables'
