'use client'

import type { Schema } from '@liam-hq/db-structure'
import clsx from 'clsx'
import { MessageSquareCode } from 'lucide-react'
import { type FC, useState } from 'react'
import { IconButton } from '@/components'
import type { ReviewComment } from '@/components/SessionDetailPage/types'
import { useSchemaUpdates } from './hooks/useSchemaUpdates'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SchemaUpdates.module.css'

type Props = {
  currentSchema: Schema
  prevSchema: Schema
  comments?: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const SchemaUpdates: FC<Props> = ({
  currentSchema,
  prevSchema,
  comments = [],
  onQuickFix,
}) => {
  const [showReviewComments, setShowReviewComments] = useState(true)

  const { cumulativeDdl, prevCumulativeDdl } = useSchemaUpdates({
    currentSchema,
    prevSchema,
  })

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
