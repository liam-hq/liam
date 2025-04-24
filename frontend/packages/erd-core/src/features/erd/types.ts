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
}

export type TableNodeType = Node<TableNodeData, 'table'>

type NonRelatedTableGroupNodeType = Node<
  Record<string, unknown>,
  'nonRelatedTableGroup'
>

export type DisplayArea = 'main' | 'relatedTables'

type TableGroupNodeData = {
  name: string
}

export type TableGroupNodeType = Node<TableGroupNodeData, 'tableGroup'>
