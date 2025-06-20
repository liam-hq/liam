import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { parse } from 'valibot'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
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
  prevSchema: Schema | undefined
}

export const ERD: FC<Props> = ({ schema, prevSchema }) => {
  return (
    <div className={styles.wrapper}>
      <VersionProvider version={version}>
        <ERDRenderer
          showDiff
          schema={{ current: schema, previous: prevSchema }}
          defaultSidebarOpen={false}
          defaultPanelSizes={[20, 80]}
        />
      </VersionProvider>
    </div>
  )
}
