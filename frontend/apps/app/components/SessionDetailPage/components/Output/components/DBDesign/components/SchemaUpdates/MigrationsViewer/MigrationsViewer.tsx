import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import { type ReviewComment, useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  doc: string
  reviewComments: ReviewComment[]
}

export const MigrationsViewer: FC<Props> = ({ doc, reviewComments }) => {
  const { ref } = useMigrationsViewer({
    doc,
    reviewComments,
  })

  return <div ref={ref} className={styles.wrapper} />
}
