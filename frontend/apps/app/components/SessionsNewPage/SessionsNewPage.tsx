import { SessionFormContainer } from '@/features/sessions/components/SessionForm'
import type { FC } from 'react'
import styles from './SessionsNewPage.module.css'

export const SessionsNewPage: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          What can I help you <br />
          Database Design?
        </h1>
        <SessionFormContainer />
      </div>
    </div>
  )
}
