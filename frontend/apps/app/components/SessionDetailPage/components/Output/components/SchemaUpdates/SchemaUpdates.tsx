'use client'

import clsx from 'clsx'
import { MessageSquareCode } from 'lucide-react'
import { type FC, useState } from 'react'
import { IconButton } from '@/components'
import type { ReviewComment } from '@/components/SessionDetailPage/types'
import { useSchemaUpdates } from './hooks/useSchemaUpdates'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SchemaUpdates.module.css'

type Props = {
  designSessionId: string
  currentVersionNumber?: number
  comments?: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const SchemaUpdates: FC<Props> = ({
  designSessionId,
  currentVersionNumber,
  comments = [],
  onQuickFix,
}) => {
  const [showReviewComments, setShowReviewComments] = useState(true)

  const { cumulativeDdl, prevCumulativeDdl, loading, error } = useSchemaUpdates(
    {
      designSessionId,
      currentVersionNumber,
    },
  )

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.body}>
          <div>Loading schema updates...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section}>
        <div className={styles.body}>
          <div>Error loading schema updates: {error}</div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
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
      <div className={styles.body}>
        <MigrationsViewer
          showDiff
          doc={cumulativeDdl}
          prevDoc={prevCumulativeDdl}
          comments={comments}
          showComments={showReviewComments}
          onQuickFix={onQuickFix}
        />
      </div>
    </section>
  )
}
