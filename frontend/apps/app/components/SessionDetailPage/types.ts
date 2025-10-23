import type { Database, Tables } from '@liam-hq/db'

export type ReviewComment = {
  fromLine: number
  toLine: number
  severity: 'High' | 'Medium' | 'Low'
  message: string
}

type VersionFromDB = Pick<
  Tables<'building_schema_versions'>,
  'id' | 'building_schema_id' | 'number' | 'patch' | 'reverse_patch'
>

export type VersionZero = {
  id: 'initial'
  building_schema_id: string
  number: 0
  patch: null
  reverse_patch: null
}

export type Version = VersionFromDB | VersionZero

export type BuildingSchema = Pick<
  Tables<'building_schemas'>,
  'id' | 'schema' | 'initial_schema_snapshot' | 'organization_id'
>

type AssistantRole = Database['public']['Enums']['assistant_role_enum']

type BaseTimelineItemEntry = {
  id: string
  content: string
  type: 'user' | 'assistant' | 'schema_version' | 'error' | 'assistant_log'
  timestamp: Date
  // Backend artifact_action field - used to determine when to show view links
  artifactAction?: 'created' | 'updated' | null
}

export type UserTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'user'
  userName?: string
}

export type AssistantTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant'
  role: AssistantRole
}

export type SchemaVersionTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'schema_version'
  buildingSchemaVersionId: string
  version: {
    id: string
    number: number
    patch: Database['public']['Tables']['building_schema_versions']['Row']['patch']
  } | null
  onView?: (versionId: string) => void
}

export type AssistantLogTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_log'
  role: AssistantRole
}

export type TimelineItemEntry =
  | UserTimelineItemEntry
  | AssistantTimelineItemEntry
  | SchemaVersionTimelineItemEntry
  | AssistantLogTimelineItemEntry
