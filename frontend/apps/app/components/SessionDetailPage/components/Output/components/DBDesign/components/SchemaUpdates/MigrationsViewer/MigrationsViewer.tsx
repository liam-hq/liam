import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import { type ReviewComment, useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  doc: string
  prevDoc?: string
  showDiff?: boolean
  comments: ReviewComment[]
  showComments: boolean
  onQuickFix?: (comment: string) => void
}

export const MigrationsViewer: FC<Props> = ({
  doc,
  prevDoc,
  showDiff,
  comments,
  showComments,
  onQuickFix,
}) => {
  const { ref } = useMigrationsViewer({
    doc,
    prevDoc,
    showDiff,
    comments,
    showComments,
    onQuickFix,
  })

  return <div ref={ref} className={styles.wrapper} />
}
