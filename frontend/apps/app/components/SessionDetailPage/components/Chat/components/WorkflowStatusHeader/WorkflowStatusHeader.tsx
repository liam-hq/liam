import type { FC } from 'react'
import styles from './WorkflowStatusHeader.module.css'

type Props = {
  isRunning: boolean
}

export const WorkflowStatusHeader: FC<Props> = ({ isRunning }) => {
  if (!isRunning) return null

  return (
    <div className={styles.wrapper}>
      <span className={styles.statusText}>Processing workflow...</span>
    </div>
  )
}
