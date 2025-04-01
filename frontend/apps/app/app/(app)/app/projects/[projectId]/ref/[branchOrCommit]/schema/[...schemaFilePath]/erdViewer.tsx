'use client'

import { CookieConsent } from '@/components/CookieConsent'
import type { DBStructure, ProcessError } from '@liam-hq/db-structure'
import type { TableGroup } from '@liam-hq/db-structure'
import {
  ERDRenderer,
  VersionProvider,
  initDBStructureStore,
  versionSchema,
} from '@liam-hq/erd-core'
import { useEffect, useState } from 'react'
import * as v from 'valibot'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

export type ERDViewerProps = {
  dbStructure: DBStructure
  tableGroups?: Record<string, TableGroup>
  errorObjects: ErrorObject[]
  defaultSidebarOpen: boolean
  defaultPanelSizes?: number[]
  projectId?: string
  branchOrCommit?: string
}

export default function ERDViewer({
  dbStructure,
  tableGroups = {},
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes = [20, 80],
  projectId,
  branchOrCommit,
}: ERDViewerProps) {
  const [isShowCookieConsent, setShowCookieConsent] = useState(false)

  useEffect(() => {
    initDBStructureStore(dbStructure)
    setShowCookieConsent(window === window.parent)
  }, [dbStructure])

  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)

  return (
    <div style={{ height: '100dvh' }}>
      <VersionProvider version={version}>
        <ERDRenderer
          defaultSidebarOpen={defaultSidebarOpen}
          defaultPanelSizes={defaultPanelSizes}
          errorObjects={errorObjects}
          tableGroups={tableGroups}
          projectId={projectId}
          branchOrCommit={branchOrCommit}
        />
      </VersionProvider>
      {isShowCookieConsent && <CookieConsent />}
    </div>
  )
}
