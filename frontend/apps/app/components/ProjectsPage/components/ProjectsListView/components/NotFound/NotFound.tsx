import type { FC } from 'react'
import { JackNoResult } from './JackNoResult'
import styles from './NotFound.module.css'

export const NotFound: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <JackNoResult />
        <h3 className={styles.title}>Oops! No results found</h3>
        <p className={styles.description}>
          Looks like there are no projects matching your search.
          <br />
          Try using different keywords.
        </p>
      </div>
    </div>
  )
}
