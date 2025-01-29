'use client'

import type { DBStructure } from '@liam-hq/db-structure'
import {
  ERDRenderer,
  VersionProvider,
  initDBStructureStore,
  versionSchema,
} from '@liam-hq/erd-core'
import { useEffect } from 'react'
import * as v from 'valibot'

type ERDViewerProps = {
  dbStructure: DBStructure
  defaultSidebarOpen: boolean
}

export default function ERDViewer({
  dbStructure,
  defaultSidebarOpen,
}: ERDViewerProps) {
  useEffect(() => {
    initDBStructureStore(dbStructure)
  }, [dbStructure])

  const versionData = {
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)

  return (
    <div style={{ height: '100vh' }}>
      <VersionProvider version={version}>
        <ERDRenderer defaultSidebarOpen={defaultSidebarOpen} />
      </VersionProvider>
    </div>
  )
}
