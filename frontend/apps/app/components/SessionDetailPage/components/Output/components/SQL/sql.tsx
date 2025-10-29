'use client'

import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import type { ReviewComment } from '../../../../types'
import { CopyButton } from '../../../CopyButton'
import { useSql } from './hooks/useSql'
import { MigrationsViewer } from './MigrationsViewer'
import styles from './SQL.module.css'

type Props = {
  currentSchema: Schema
  comments?: ReviewComment[]
}

export const SQL: FC<Props> = ({ currentSchema, comments = [] }) => {
  const { cumulativeDdl } = useSql({
    currentSchema,
  })

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <CopyButton textToCopy={cumulativeDdl} tooltipLabel="Copy Migrations" />
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
