import clsx from 'clsx'
import type { FC } from 'react'
import styles from './Spinner.module.css'

type Props = {
  className?: string
}

export const Spinner: FC<Props> = ({ className }) => {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is appropriate for loading indicators
    <div
      className={clsx(styles.spinnerBox, className)}
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
