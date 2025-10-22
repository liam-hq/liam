import type { FC } from 'react'
import styles from './AgentStatusBar.module.css'

type Props = {
  isRunning: boolean
}

export const AgentStatusBar: FC<Props> = ({ isRunning }) => {
  if (!isRunning) {
    return null
  }

  return (
    <div className={styles.statusBar}>
      <div className={styles.content}>
        <div className={styles.indicator}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
        <span className={styles.text}>Agent is processing...</span>
      </div>
    </div>
  )
}
