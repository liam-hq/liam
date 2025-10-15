import type { FC } from 'react'
import styles from './WorkflowStatusHeader.module.css'

type Props = {
  isRunning: boolean
  hasMessages?: boolean
}

export const WorkflowStatusHeader: FC<Props> = ({
  isRunning,
  hasMessages = false,
}) => {
  if (!hasMessages) return null

  return (
    <div className={styles.wrapper}>
      <span
        className={
          isRunning ? styles.statusTextRunning : styles.statusTextCompleted
        }
      >
        {isRunning ? 'Processing workflow...' : 'Completed'}
      </span>
    </div>
  )
}
