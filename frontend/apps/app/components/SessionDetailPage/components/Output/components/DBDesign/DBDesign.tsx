import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { parse } from 'valibot'
import styles from './DBDesign.module.css'
import { MigrationsViewer } from './MigrationsViewer'
import { MIGRATIONS_DOC, REVIEW_COMMENTS } from './mock'

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

export const DBDesign: FC<Props> = ({ schema }) => {
  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ER Diagram</h2>
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
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Schema Updates</h2>
        <MigrationsViewer
          doc={MIGRATIONS_DOC}
          reviewComments={REVIEW_COMMENTS}
        />
      </section>
    </div>
  )
}
