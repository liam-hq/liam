import type { FC } from 'react'
import { MrJack } from './MrJack'
import styles from './NetworkErrorDisplay.module.css'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type Props = {
  errors: ErrorObject[]
}

export const NetworkErrorDisplay: FC<Props> = ({ errors }) => {
  return (
    <div className={styles.wrapper}>
      <div>
        <MrJack />
      </div>
      {errors[0] && (
        <div className={styles.message}>
          <div className={styles.inner}>
            <div className={styles.silentHere}>Hmm, it's silent here...</div>
            <div className={styles.errorMessage}>{errors[0].message}</div>
            <div className={styles.instruction}>{errors[0].instruction}</div>
          </div>
        </div>
      )}
    </div>
  )
}
