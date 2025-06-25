import type { FC } from 'react'
import { useId } from 'react'
import styles from './RelationshipEdgeParticleMarker.module.css'

export const RelationshipEdgeParticleMarker: FC = () => {
  const gradientId = useId()
  
  return (
    <svg
      width="0"
      height="0"
      role="img"
      aria-label="Relationship Edge Particle Marker"
      className={styles.wrapper}
    >
      <defs>
        <radialGradient
          id={gradientId}
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
    </svg>
  )
}
