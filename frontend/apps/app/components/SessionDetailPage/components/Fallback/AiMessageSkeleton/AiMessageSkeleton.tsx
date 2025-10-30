import { Skeleton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './AiMessageSkeleton.module.css'

type Props = {
  noOfLines?: number
}

export const AiMessageSkeleton: FC<Props> = ({ noOfLines = 4 }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarContainer}>
        <Skeleton variant="circle" size="24px" />
        <Skeleton variant="box" width="80px" height="16px" />
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messagesWrapper}>
          <div className={styles.responseMessageWrapper}>
            <div className={styles.markdownWrapper}>
              <Skeleton variant="text" noOfLines={noOfLines} gap={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
