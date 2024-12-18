import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react'

import clsx from 'clsx'
import type { FC } from 'react'
import styles from './RelationshipEdge.module.css'
import type { RelationshipEdgeType } from './type'

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
        markerStart={
          data?.cardinality
            ? data?.isHighlighted
              ? 'url(#zeroOrOneRightHighlight)'
              : 'url(#zeroOrOneRight)'
            : ''
        }
        markerEnd={
          data?.cardinality === 'ONE_TO_ONE'
            ? data?.isHighlighted
              ? 'url(#zeroOrOneLeftHighlight)'
              : 'url(#zeroOrOneLeft)'
            : data?.cardinality === 'ONE_TO_MANY'
              ? data?.isHighlighted
                ? 'url(#zeroOrManyLeftHighlight)'
                : 'url(#zeroOrManyLeft)'
              : ''
        }
        className={clsx(styles.edge, data?.isHighlighted && styles.hovered)}
      />
    </>
  )
}
