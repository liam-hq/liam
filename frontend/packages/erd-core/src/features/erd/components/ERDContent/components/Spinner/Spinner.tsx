import clsx from 'clsx'
import type { FC } from 'react'
import styles from './Spinner.module.css'

type Props = {
  className?: string
}

export const Spinner: FC<Props> = ({ className }) => {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <output> tag doesn't make sense for a loading spinner
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
