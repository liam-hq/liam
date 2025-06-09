import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import type { ReviewComment } from './types'
import { useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  ddl: string
  reviewComments: ReviewComment[]
}

export const MigrationsViewer: FC<Props> = ({ ddl, reviewComments }) => {
  const { ref } = useMigrationsViewer({
    initialDoc: ddl,
    reviewComments,
  })

  return <div ref={ref} className={styles.wrapper} />
}
