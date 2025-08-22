'use client'

import { ERDRenderer, VersionProvider, versionSchema } from '@liam-hq/erd-core'
import { ErdRendererProvider } from '@liam-hq/erd-core/nextjs'
import type { Schema } from '@liam-hq/schema'
import { useEffect, useState } from 'react'
import * as v from 'valibot'
import { CookieConsent } from '@/components/CookieConsent'

type ErrorObject = {
  name: string
  message: string
  instruction: string
}

type ERDViewerProps = {
  schema: Schema
  errorObjects: ErrorObject[]
  defaultSidebarOpen: boolean
  defaultPanelSizes: number[]
}

export default function ERDViewer({
  schema,
  errorObjects,
  defaultSidebarOpen,
  defaultPanelSizes,
}: ERDViewerProps) {
  const [isShowCookieConsent, setShowCookieConsent] = useState(false)

  useEffect(() => {
    setShowCookieConsent(window === window.parent)
  }, [])

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
        <ErdRendererProvider schema={{ current: schema }}>
          <ERDRenderer
            withAppBar
            defaultSidebarOpen={defaultSidebarOpen}
            defaultPanelSizes={defaultPanelSizes}
            errorObjects={errorObjects}
          />
        </ErdRendererProvider>
      </VersionProvider>
      {isShowCookieConsent && <CookieConsent />}
    </div>
  )
}
