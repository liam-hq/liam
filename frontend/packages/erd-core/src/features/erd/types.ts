import type { ShowMode } from '@/schemas/showMode/types'
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
  showMode?: ShowMode | undefined
  // Request-related information
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  request?: any // Request details
}

export type TableNodeType = Node<TableNodeData, 'table'>

export type NonRelatedTableGroupNodeType = Node<
  Record<string, unknown>,
  'nonRelatedTableGroup'
>

export type DisplayArea = 'main' | 'relatedTables'

export type TableGroupNodeData = {
  name: string
}

export type TableGroupNodeType = Node<TableGroupNodeData, 'tableGroup'>
