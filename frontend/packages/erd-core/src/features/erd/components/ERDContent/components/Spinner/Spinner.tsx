import clsx from 'clsx'
import type { FC } from 'react'
import styles from './Spinner.module.css'

type Props = {
  className?: string
}

export const Spinner: FC<Props> = ({ className }) => {
  return (
    <div
      className={clsx(styles.spinnerBox, className)}
      // biome-ignore lint/a11y/useSemanticElements: Because div and status role are common for loading spinners
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span className={styles.circleBorder}>
        <span className={styles.circleCore} />
      </span>
    </div>
  )
}
