import type { ShowMode } from '@/schemas/showMode/types'
import type { Cardinality, Table } from '@liam-hq/db-structure'
import type { Node } from '@xyflow/react'

export type CommentMessageType = {
  id: string
  content: string
  isUser: boolean
  timestamp?: Date
}

export type CommentNodeData = {
  tableId: string
  messages: CommentMessageType[]
}
export type CommentNodeType = Node<CommentNodeData, 'comment'>

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

export type NonRelatedTableGroupNodeType = Node<
  Record<string, unknown>,
  'nonRelatedTableGroup'
>

export type DisplayArea = 'main' | 'relatedTables'

export type TableGroupNodeData = {
  name: string
}

export type TableGroupNodeType = Node<TableGroupNodeData, 'tableGroup'>
