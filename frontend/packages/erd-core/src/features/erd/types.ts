import type { Cardinality, Table } from '@liam-hq/db-structure'
import type { Node } from '@xyflow/react'
import type { ShowMode } from '@/schemas/showMode/types'

export type TableNodeData = {
  table: Table
  isActiveHighlighted: boolean
  isHighlighted: boolean
  isTooltipVisible: boolean
  sourceColumnName: string | undefined
  targetColumnCardinalities?:
    | Record<string, Cardinality | undefined>
    | undefined
  showMode?: ShowMode | undefined
}

export type TableNodeType = Node<TableNodeData, 'table'>

export type DisplayArea = 'main' | 'relatedTables'

type TableGroupNodeData = {
  name: string
}

export type TableGroupNodeType = Node<TableGroupNodeData, 'tableGroup'>
