'use client'

import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import { CopyButton } from '../../../CopyButton'
import { useDdl } from './hooks/useDdl'
import styles from './Migrations.module.css'
import { MigrationsViewer } from './MigrationsViewer'

type Props = {
  schema: Schema
  baselineSchema: Schema
}

export const Migrations: FC<Props> = ({ schema, baselineSchema }) => {
  const { cumulativeDdl } = useDdl({
    baselineSchema,
    schema,
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
        <MigrationsViewer doc={cumulativeDdl} />
      </div>
    </section>
  )
}
