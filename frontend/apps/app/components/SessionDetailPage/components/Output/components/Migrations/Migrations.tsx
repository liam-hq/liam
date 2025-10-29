'use client'

import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import type { ReviewComment } from '../../../../types'
import { CopyButton } from '../../../CopyButton'
import { useDdl } from './hooks/useDdl'
import styles from './Migrations.module.css'
import { MigrationsViewer } from './MigrationsViewer'

type Props = {
  currentSchema: Schema
  comments?: ReviewComment[]
}

export const Migrations: FC<Props> = ({ currentSchema, comments = [] }) => {
  const { cumulativeDdl } = useDdl({
    currentSchema,
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
          doc={cumulativeDdl}
          comments={comments}
          showComments={false}
        />
      </div>
    </section>
  )
}
