'use client'

import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect } from 'react'
import { parse } from 'valibot'

type Props = {
  key: string
  schema: Schema
}

export const RelatedSchema: FC<Props> = ({ key, schema }) => {
  const version = parse(versionSchema, {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  })

  useEffect(() => {
    initSchemaStore({
      current: schema,
    })
  }, [schema])

  return (
    <VersionProvider version={version}>
      <ERDRenderer key={key} />
    </VersionProvider>
  )
}
