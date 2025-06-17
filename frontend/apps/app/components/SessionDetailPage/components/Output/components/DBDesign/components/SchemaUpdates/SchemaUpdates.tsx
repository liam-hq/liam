'use client'

import { IconButton } from '@/components'
import clsx from 'clsx'
import { FileDiff, MessageSquareCode } from 'lucide-react'
import { type FC, useState } from 'react'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SchemaUpdates.module.css'
import { MIGRATIONS_DOC, REVIEW_COMMENTS } from './mock'

type Props = {
  onQuickFix?: (comment: string) => void
}

export const SchemaUpdates: FC<Props> = ({ onQuickFix }) => {
  const [showDiffView, setShowDiffView] = useState(false)
  const [showReviewComments, setShowReviewComments] = useState(false)

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.sectionTitle}>Schema Updates</h2>
        <div className={styles.controls}>
          <IconButton
            icon={<FileDiff className={clsx(showDiffView && styles.active)} />}
            tooltipContent="Diff View"
            onClick={() => setShowDiffView((prev) => !prev)}
          />
          <IconButton
            icon={
              <MessageSquareCode
                className={clsx(showReviewComments && styles.active)}
              />
            }
            tooltipContent="Migration Review"
            onClick={() => setShowReviewComments((prev) => !prev)}
          />
        </div>
      </div>
      <MigrationsViewer
        doc={MIGRATIONS_DOC}
        comments={REVIEW_COMMENTS}
        showComments={showReviewComments}
        onQuickFix={onQuickFix}
      />
    </section>
  )
}
