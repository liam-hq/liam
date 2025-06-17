'use client'

import { IconButton } from '@/components'
import clsx from 'clsx'
import { FileDiff, MessageSquareCode } from 'lucide-react'
import { type FC, useMemo, useState } from 'react'
import { MigrationsViewer } from './MigrationsViewer'
import type { ReviewComment } from './MigrationsViewer/useMigrationsViewer'
import styles from './SchemaUpdates.module.css'

type Props = {
  schemaUpdatesDoc: string
  prevSchemaUpdatesDoc?: string
  comments: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const SchemaUpdates: FC<Props> = ({
  schemaUpdatesDoc,
  prevSchemaUpdatesDoc,
  comments,
  onQuickFix,
}) => {
  const [showDiff, setShowDiff] = useState(false)
  const [showReviewComments, setShowReviewComments] = useState(false)

  const disabledShowDiff = useMemo(() => {
    return !prevSchemaUpdatesDoc
  }, [prevSchemaUpdatesDoc])

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.sectionTitle}>Schema Updates</h2>
        <div className={styles.controls}>
          <IconButton
            disabled={disabledShowDiff}
            icon={
              <FileDiff
                className={clsx(showDiff && !disabledShowDiff && styles.active)}
              />
            }
            tooltipContent="Diff View"
            onClick={() => setShowDiff((prev) => !prev)}
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
        doc={schemaUpdatesDoc}
        prevDoc={prevSchemaUpdatesDoc}
        showDiff={showDiff}
        comments={comments}
        showComments={showReviewComments}
        onQuickFix={onQuickFix}
      />
    </section>
  )
}
