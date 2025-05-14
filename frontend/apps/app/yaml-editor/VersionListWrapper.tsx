'use client'

import { VersionList } from './VersionList'
// Import the VersionId type for TypeScript
import { type VersionId } from './schemaVersionStore'

interface VersionListWrapperProps {
  isLoading?: boolean
  schemaId?: string
}

export function VersionListWrapper({ isLoading = false, schemaId }: VersionListWrapperProps) {
  // The schema store is already initialized in SchemaApp
  return <VersionList isLoading={isLoading} />
}
