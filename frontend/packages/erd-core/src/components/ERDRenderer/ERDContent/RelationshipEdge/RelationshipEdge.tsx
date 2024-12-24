import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import styles from './RelationshipEdge.module.css'
import type { RelationshipEdgeType } from './type'

const PARTICLE_COUNT = 6
const ANIMATE_DURATION = 3

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
        <radialGradient
          id="myGradient"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="var(--node-layout)" stopOpacity="1" />
          <stop
            offset="100%"
            stopColor="var(--node-layout)"
            stopOpacity="0.4"
          />
        </radialGradient>
      </defs>
      {data?.isHighlighted &&
        [...Array(PARTICLE_COUNT)].map((_, i) => (
          <ellipse
            key={`particle-${i}-${ANIMATE_DURATION}`}
            rx="5"
            ry="1.6"
            fill="url(#myGradient)"
          >
            <animateMotion
              begin={`${i * (ANIMATE_DURATION / PARTICLE_COUNT)}s`}
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
