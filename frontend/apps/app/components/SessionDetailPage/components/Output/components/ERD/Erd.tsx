import { ERDRenderer, VersionProvider, versionSchema } from '@liam-hq/erd-core'
import { ErdRendererProvider } from '@liam-hq/erd-core/nextjs'
import type { Schema } from '@liam-hq/schema'
import { type FC, useMemo } from 'react'
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
  baselineSchema: Schema
}

export const ERD: FC<Props> = ({ schema, baselineSchema }) => {
  const schemaKey = useMemo(() => {
    return JSON.stringify({ current: schema, baselineSchema })
  }, [schema, baselineSchema])

  return (
    <div className={styles.wrapper}>
      <VersionProvider version={version}>
        <ErdRendererProvider
          schema={{ current: schema, baseline: baselineSchema }}
          showDiff
          defaultShowMode="ALL_FIELDS"
        >
          <ERDRenderer
            key={schemaKey}
            defaultSidebarOpen={false}
            defaultPanelSizes={[20, 80]}
          />
        </ErdRendererProvider>
      </VersionProvider>
    </div>
  )
}
