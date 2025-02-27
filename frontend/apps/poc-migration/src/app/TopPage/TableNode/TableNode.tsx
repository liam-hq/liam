'use client'

import type { Cardinality, Table } from '@liam-hq/db-structure'
import type { Node, NodeProps } from '@xyflow/react'
import type { FC } from 'react'
import { columnHandleId } from '../utils'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

export type Data = {
  table: Table
  isActiveHighlighted: boolean
  isHighlighted: boolean
  sourceColumnName: string | undefined
  targetColumnCardinalities?:
    | Record<string, Cardinality | undefined>
    | undefined
}

type TableNodeType = Node<Data, 'table'>

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data }) => {
  return (
    <div className={styles.wrapper}>
      <TableHeader data={data} />
      <TableColumnList data={data} />
    </div>
  )
}
