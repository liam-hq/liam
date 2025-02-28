import { DrawerDescription } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Comment.module.css'

type Props = {
  comment: string
}

export const Comment: FC<Props> = ({ comment }) => {
  return (
    <div className={styles.wrapper}>
      <DrawerDescription className={styles.text}>{comment}</DrawerDescription>
    </div>
  )
}
