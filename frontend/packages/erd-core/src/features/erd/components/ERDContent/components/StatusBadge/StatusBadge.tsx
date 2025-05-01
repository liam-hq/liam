import clsx from 'clsx'
import type { FC } from 'react'
import styles from './StatusBadge.module.css'

type StatusType = 'open' | 'in_progress' | 'done' | 'wontfix' | 'unknown'

type Props = {
  status?: StatusType
  className?: string
}

export const StatusBadge: FC<Props> = ({ status = 'open', className }) => {
  return (
    <div className={clsx(styles.badge, styles[status], className)}>
      {status === 'open' && 'TODO'}
      {status === 'in_progress' && 'In Progress'}
      {status === 'done' && 'Done'}
      {status === 'wontfix' && "Won't Fix"}
      {status === 'unknown' && 'Unknown'}
    </div>
  )
}
