import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import { type ReviewComment, useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  doc: string
  reviewComments: ReviewComment[]
  showComments: boolean
}

export const MigrationsViewer: FC<Props> = ({
  doc,
  reviewComments,
  showComments,
}) => {
  const { ref } = useMigrationsViewer({
    doc,
    reviewComments,
    showComments,
  })

  return <div ref={ref} className={styles.wrapper} />
}
