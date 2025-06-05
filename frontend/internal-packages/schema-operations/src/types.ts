// JSON Patch Operation type - compatible with fast-json-patch
export interface Operation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: unknown
  from?: string
}

// Schema update payload for background jobs
export interface SchemaUpdatePayload {
  buildingSchemaId: string
  latestVersionNumber: number
  patchOperations: Operation[]
  userMessage: string
  organizationId: string
  userId?: string
}

// Result of schema update operation
export interface SchemaUpdateResult {
  success: boolean
  versionNumber?: number
  error?: string
}

// Parameters for creating a new version
export interface CreateVersionParams {
  buildingSchemaId: string
  latestVersionNumber: number
  patch: Operation[]
}

// Response from version creation
export interface VersionResponse {
  success: boolean
  error?: string | null
}

import type { createClient as _createClient } from '@liam-hq/db'

export type SupabaseClient = ReturnType<typeof _createClient>
