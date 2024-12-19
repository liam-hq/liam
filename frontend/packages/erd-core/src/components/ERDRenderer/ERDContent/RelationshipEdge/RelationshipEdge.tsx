import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'

import type { Relationship } from '@liam-hq/db-structure'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './RelationshipEdge.module.css'

export const isRelationshipEdge = (edge: Edge): edge is RelationshipEdgeType =>
  edge.type === 'relationship'

type Data = {
  isHighlighted: boolean
  relationship: Relationship
}

export type RelationshipEdgeType = Edge<Data, 'relationship'>

type Props = EdgeProps<RelationshipEdgeType>

export const RelationshipEdge: FC<Props> = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  id,
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={clsx(styles.edge, data?.isHighlighted && styles.hovered)}
      />
    </>
  )
}
