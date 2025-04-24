import { DiffCount } from '@/components/DiffCount'
import type { FC } from 'react'
import styles from './DiffCounts.module.css'

interface DiffCountsProps {
  additions: number
  deletions: number
}

export const DiffCounts: FC<DiffCountsProps> = ({ additions, deletions }) => {
  return (
    <div className={styles.container}>
      {additions > 0 && <DiffCount count={additions} variant="new" />}
      {deletions > 0 && <DiffCount count={deletions} variant="delete" />}
    </div>
  )
}
