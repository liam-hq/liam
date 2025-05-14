'use client'

import { YamlEditor } from './YamlEditor'
// Import the VersionId type for TypeScript
import { type VersionId } from './schemaVersionStore'

interface YamlEditorWrapperProps {
  isLoading?: boolean
  schemaId?: string
}

export function YamlEditorWrapper({ isLoading = false, schemaId }: YamlEditorWrapperProps) {
  // The schema store is already initialized in SchemaApp
  return <YamlEditor isLoading={isLoading} />
}
