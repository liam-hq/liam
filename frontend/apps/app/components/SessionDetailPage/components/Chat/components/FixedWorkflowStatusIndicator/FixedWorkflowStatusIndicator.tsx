import type { FC } from 'react'
import styles from './FixedWorkflowStatusIndicator.module.css'

type Props = {
  statusText?: string
}

export const FixedWorkflowStatusIndicator: FC<Props> = ({
  statusText = 'Updating schema...',
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.spinner}>
          <svg
            className={styles.spinnerSvg}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Loading"
          >
            <title>Loading</title>
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </div>
        <span className={styles.text}>{statusText}</span>
      </div>
    </div>
  )
}
