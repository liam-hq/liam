import { DrawerDescription } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './Comment.module.css'

type Props = {
  comment: string
}

export const Comment: FC<Props> = ({ comment }) => {
  return (
    <DrawerDescription className={styles.wrapper}>
      <span className={styles.text}>{comment}</span>
    </DrawerDescription>
  )
}
