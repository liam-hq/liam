import type { FC } from 'react'
import styles from './DiffCount.module.css'

type DiffCountVariant = 'new' | 'delete'

interface DiffCountProps {
  count: number
  variant: DiffCountVariant
}

export const DiffCount: FC<DiffCountProps> = ({ count, variant }) => {
  const prefix = variant === 'new' ? '+' : '-'
  const absoluteCount = Math.abs(count)

  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      {`${prefix}${absoluteCount}`}
    </div>
  )
}
