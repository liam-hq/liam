'use client'

import type { Schema } from '@liam-hq/db-structure'
import { ERDRendererProvider } from '@liam-hq/erd-core/nextjs'
import type { ComponentProps, FC } from 'react'
import { parse } from 'valibot'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import styles from './ERDEditor.module.css'

type Props = {
  schema: Schema
  errorObjects: ComponentProps<typeof ERDRenderer>['errorObjects']
  defaultSidebarOpen: boolean
  defaultPanelSizes?: number[]
  projectId?: string
  branchOrCommit?: string
}

export const ERDEditor: FC<Props> = ({
  schema,
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes = [20, 80],
}) => {
  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  return (
    <div className={styles.wrapper}>
      <VersionProvider version={version}>
        <ERDRendererProvider schema={{ current: schema }}>
          <ERDRenderer
            defaultSidebarOpen={defaultSidebarOpen}
            defaultPanelSizes={defaultPanelSizes}
            errorObjects={errorObjects}
          />
        </ERDRendererProvider>
      </VersionProvider>
    </div>
  )
}
