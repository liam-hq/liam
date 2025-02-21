import type { Node } from '@xyflow/react'
import type { TableNodeType } from '../types'

export const isTableNode = (node: Node): node is TableNodeType =>
  node.type === 'table'
