'use client'

import { ERDRenderer, VersionProvider, versionSchema } from '@liam-hq/erd-core'
import { ErdRendererProvider } from '@liam-hq/erd-core/nextjs'
import type { Schema } from '@liam-hq/schema'
import type { ComponentProps, FC } from 'react'
import { parse } from 'valibot'
import { CreateDesignSessionButton } from '../CreateDesignSessionButton'
import styles from './ERDEditor.module.css'

type Props = {
  schema: Schema
  errorObjects: ComponentProps<typeof ERDRenderer>['errorObjects']
  defaultSidebarOpen: boolean
  defaultPanelSizes?: number[]
  projectId: string
  branchOrCommit: string
}

export const ERDEditor: FC<Props> = ({
  schema,
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes = [20, 80],
  projectId,
  branchOrCommit,
}) => {
  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  const customActions = (
    <CreateDesignSessionButton
      projectId={projectId}
      branchOrCommit={branchOrCommit}
    />
  )

  return (
    <div className={styles.wrapper}>
      <VersionProvider version={version}>
        <ErdRendererProvider schema={{ current: schema }}>
          <ERDRenderer
            defaultSidebarOpen={defaultSidebarOpen}
            defaultPanelSizes={defaultPanelSizes}
            errorObjects={errorObjects}
            customToolbarActions={customActions}
          />
        </ErdRendererProvider>
      </VersionProvider>
    </div>
  )
}
