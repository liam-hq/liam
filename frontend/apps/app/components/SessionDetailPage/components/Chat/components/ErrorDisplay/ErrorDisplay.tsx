'use client'

import clsx from 'clsx'
import type { FC } from 'react'
import styles from './ErrorDisplay.module.css'

type Props = {
  error: string
}

export const ErrorDisplay: FC<Props> = ({ error }) => {
  return (
    <div
      className={clsx(styles.alertWrapper, styles.errorDisplay)}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.alertHeaderContainer}>
        <div className={styles.alertIcon} aria-hidden="true">
          ❌
        </div>
        <span className={clsx(styles.alertLabel, styles.errorDisplayLabel)}>
          Error
        </span>
      </div>
      <div className={styles.alertContentContainer}>
        <div className={styles.errorContent}>{error}</div>
      </div>
    </div>
  )
}
