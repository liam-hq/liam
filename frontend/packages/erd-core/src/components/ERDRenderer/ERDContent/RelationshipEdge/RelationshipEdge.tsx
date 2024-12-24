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
      <defs>
        <linearGradient id="myGradient" gradientTransform="rotate(45)">
          <stop offset="0%" stop-color="white" stop-opacity="0.9" />
          <stop offset="45%" stop-color="rgba(255, 255, 255, 0.8)" />
          <stop offset="50%" stop-color="rgba(255, 255, 255, 1)" />
          <stop offset="55%" stop-color="rgba(255, 255, 255, 0.8)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.3)" />
        </linearGradient>
      </defs>
      <path path={edgePath} stroke="url('#myGradient')" />

      {data?.isHighlighted && (
        <rect
          width="10"
          height="2"
          x="-5"
          y="-1"
          rx="1"
          fill="url('#myGradient')"
        >
          <animateMotion
            begin="0s"
            dur="3s"
            repeatCount="indefinite"
            rotate="auto"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
            path={edgePath}
          />
        </rect>
      )}
    </>
  )
}
