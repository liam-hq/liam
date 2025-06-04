import type { FC } from 'react'
import { JackBuildIcon } from '../../JackBuildIcon'
import { JackFixIcon } from '../../JackFixIcon'
import { JackLearnIcon } from '../../JackLearnIcon'
import styles from './Team.module.css'

export const Team: FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.item}>
        <JackBuildIcon className={styles.icon} />
        <span className={styles.text}>DB Agent</span>
      </div>
      <div className={styles.item}>
        <JackLearnIcon className={styles.icon} />
        <span className={styles.text}>PM Agent</span>
      </div>
      <div className={styles.item}>
        <JackFixIcon className={styles.icon} />
        <span className={styles.text}>QA Agent</span>
      </div>
    </div>
  )
}
