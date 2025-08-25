'use client'

import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import type { ReviewComment } from '@/components/SessionDetailPage/types'
import { CopyButton } from '../shared/CopyButton'
import { useSql } from './hooks/useSql'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SQL.module.css'

type Props = {
  currentSchema: Schema
  prevSchema: Schema
  comments?: ReviewComment[]
}

export const SQL: FC<Props> = ({
  currentSchema,
  prevSchema,
  comments = [],
}) => {
  const { cumulativeDdl, prevCumulativeDdl } = useSql({
    currentSchema,
    prevSchema,
  })

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <CopyButton
          textToCopy={cumulativeDdl}
          tooltipLabel="Copy Migration Diff"
        />
      </div>
      <div className={styles.body}>
        <MigrationsViewer
          showDiff
          doc={cumulativeDdl}
          prevDoc={prevCumulativeDdl}
          comments={comments}
          showComments={false}
        />
      </div>
    </section>
  )
}
