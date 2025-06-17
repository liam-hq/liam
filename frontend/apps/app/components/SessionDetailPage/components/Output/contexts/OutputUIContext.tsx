'use client'

import type { Schema } from '@liam-hq/db-structure'
import { createContext } from 'react'
import type { ReviewComment } from '../components/DBDesign/components/SchemaUpdates/MigrationsViewer/useMigrationsViewer'

type OutputUIState = {
  selectedVersion: number
}

export type VersionData = {
  schema: Schema
  artifactContent: string
  schemaUpdatesDoc: string
  comments: ReviewComment[]
}

export type OutputUIContextType = {
  state: OutputUIState
  actions: {
    setSelectedVersion: (version: number) => void
  }
  versionData: {
    [version: number]: VersionData
  }
}

export const OutputUIContext = createContext<OutputUIContextType | null>(null)
