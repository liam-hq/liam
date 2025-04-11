'use client'

import { CookieConsent } from '@/components/CookieConsent'
import { ERDRenderer } from '@/features'
import { useTableGroups } from '@/hooks'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initDBStructureStore } from '@/stores'
import type { DBStructure, TableGroup } from '@liam-hq/db-structure'
import { type FC, useEffect, useState } from 'react'
import { parse } from 'valibot'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

export type Props = {
  dbStructure: DBStructure
  tableGroups?: Record<string, TableGroup>
  errorObjects: ErrorObject[]
  defaultSidebarOpen: boolean
  defaultPanelSizes?: number[]
  onAddTableGroup?: (tableGroup: TableGroup) => void
}

export const ErdViewer: FC<Props> = ({
  dbStructure,
  tableGroups: initialTableGroups = {},
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes = [20, 80],
  onAddTableGroup,
}) => {
  const [isShowCookieConsent, setShowCookieConsent] = useState(false)
  const { tableGroups, addTableGroup } = useTableGroups(initialTableGroups)

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
  const version = parse(versionSchema, versionData)

  const handleAddTableGroup = (tableGroup: TableGroup) => {
    addTableGroup(tableGroup)

    if (onAddTableGroup) {
      onAddTableGroup(tableGroup)
    }
  }

  return (
    <div style={{ height: '100%', maxHeight: '600px', position: 'relative' }}>
      <VersionProvider version={version}>
        <ERDRenderer
          defaultSidebarOpen={defaultSidebarOpen}
          defaultPanelSizes={defaultPanelSizes}
          errorObjects={errorObjects}
          tableGroups={tableGroups}
          onAddTableGroup={handleAddTableGroup}
        />
      </VersionProvider>
      {isShowCookieConsent && <CookieConsent />}
    </div>
  )
}
