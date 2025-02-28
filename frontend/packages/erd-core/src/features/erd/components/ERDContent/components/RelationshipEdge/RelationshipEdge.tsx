import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react'

import clsx from 'clsx'
import type { FC } from 'react'
import styles from './RelationshipEdge.module.css'
import type { RelationshipEdgeType } from './type'

const PARTICLE_COUNT = 6
const ANIMATE_DURATION = 6

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
          data?.isHighlighted
            ? 'url(#zeroOrOneRightHighlight)'
            : 'url(#zeroOrOneRight)'
        }
        markerEnd={
          data?.cardinality === 'ONE_TO_ONE'
            ? data?.isHighlighted
              ? 'url(#zeroOrOneLeftHighlight)'
              : 'url(#zeroOrOneLeft)'
            : data?.isHighlighted
              ? 'url(#zeroOrManyLeftHighlight)'
              : 'url(#zeroOrManyLeft)'
        }
        className={clsx(styles.edge, data?.isHighlighted && styles.hovered)}
      />
      {data?.isHighlighted &&
        [...Array(PARTICLE_COUNT)].map((_, i) => (
          <ellipse
            key={`particle-${i}-${ANIMATE_DURATION}`}
            rx="5"
            ry="1.2"
            fill="url(#myGradient)"
          >
            <animateMotion
              begin={`${-i * (ANIMATE_DURATION / PARTICLE_COUNT)}s`}
              dur={`${ANIMATE_DURATION}s`}
              repeatCount="indefinite"
              rotate="auto"
              path={edgePath}
              calcMode="spline"
              keySplines="0.42, 0, 0.58, 1.0"
            />
          </ellipse>
        ))}
    </>
  )
}
