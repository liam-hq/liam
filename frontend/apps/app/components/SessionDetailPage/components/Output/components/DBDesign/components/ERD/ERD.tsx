'use client'

import { IconButton } from '@/components'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import type { Schema } from '@liam-hq/db-structure'
import clsx from 'clsx'
import { FileDiff } from 'lucide-react'
import { type FC, useState } from 'react'
import { parse } from 'valibot'
import styles from './ERD.module.css'

const version = parse(versionSchema, {
  version: '0.1.0',
  gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
  envName: process.env.NEXT_PUBLIC_ENV_NAME,
  date: process.env.NEXT_PUBLIC_RELEASE_DATE,
  displayedOn: 'web',
})

type Props = {
  schema: Schema
}

export const ERD: FC<Props> = ({ schema }) => {
  const [isShowDiffView, setIsShowDiffView] = useState(false)

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.sectionTitle}>ER Diagram</h2>
        <IconButton
          icon={<FileDiff className={clsx(isShowDiffView && styles.active)} />}
          tooltipContent="Diff View"
          onClick={() => setIsShowDiffView((prev) => !prev)}
        />
      </div>
      <div className={styles.erdWrapper}>
        <VersionProvider version={version}>
          <ERDRenderer
            schema={{ current: schema }}
            defaultSidebarOpen={false}
            defaultPanelSizes={[20, 80]}
          />
        </VersionProvider>
      </div>
    </section>
  )
}
