'use client'

import { IconButton } from '@/components'
import clsx from 'clsx'
import { FileDiff, MessageSquareCode } from 'lucide-react'
import { type FC, useState } from 'react'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SchemaUpdates.module.css'
import { MIGRATIONS_DOC, REVIEW_COMMENTS } from './mock'

export const SchemaUpdates: FC = () => {
  const [isShowDiffView, setIsShowDiffView] = useState(false)
  const [isShowMigrationReview, setIsShowMigrationReview] = useState(false)

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.sectionTitle}>Schema Updates</h2>
        <div className={styles.controls}>
          <IconButton
            icon={
              <FileDiff className={clsx(isShowDiffView && styles.active)} />
            }
            tooltipContent="Diff View"
            onClick={() => setIsShowDiffView((prev) => !prev)}
          />
          <IconButton
            icon={
              <MessageSquareCode
                className={clsx(isShowMigrationReview && styles.active)}
              />
            }
            tooltipContent="Migration Review"
            onClick={() => setIsShowMigrationReview((prev) => !prev)}
          />
        </div>
      </div>
      <MigrationsViewer doc={MIGRATIONS_DOC} reviewComments={REVIEW_COMMENTS} />
    </section>
  )
}
