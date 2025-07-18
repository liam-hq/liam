import type { Database, Tables } from '@liam-hq/db'
import type * as v from 'valibot'

export type ReviewComment = {
  fromLine: number
  toLine: number
  severity: 'High' | 'Medium' | 'Low'
  message: string
}

export type Version = Pick<
  Tables<'building_schema_versions'>,
  'id' | 'building_schema_id' | 'number' | 'patch' | 'reverse_patch'
>

export type BuildingSchema = Pick<
  Tables<'building_schemas'>,
  'id' | 'schema' | 'initial_schema_snapshot'
>

export type TimelineItem = Pick<
  Tables<'timeline_items'>,
  | 'id'
  | 'content'
  | 'type'
  | 'user_id'
  | 'created_at'
  | 'organization_id'
  | 'design_session_id'
  | 'building_schema_version_id'
  | 'assistant_role'
>

export type DesignSessionWithTimelineItems = Pick<
  Tables<'design_sessions'>,
  'id' | 'organization_id'
> & {
  timeline_items: TimelineItem[]
}

export type WorkflowRunStatus =
  Database['public']['Enums']['workflow_run_status']

type AssistantRole = Database['public']['Enums']['assistant_role_enum']

type BaseTimelineItemEntry = {
  id: string
  content: string
  type: 'user' | 'assistant' | 'schema_version' | 'error' | 'assistant_log'
  timestamp: Date
}

export type UserTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'user'
}

export type AssistantTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant'
  role: AssistantRole
}

export type SchemaVersionTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'schema_version'
  buildingSchemaVersionId: string
}

export type ErrorTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'error'
  onRetry?: () => void
}

export type AssistantLogTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_log'
  role: AssistantRole
}

export type TimelineItemEntry =
  | UserTimelineItemEntry
  | AssistantTimelineItemEntry
  | SchemaVersionTimelineItemEntry
  | ErrorTimelineItemEntry
  | AssistantLogTimelineItemEntry
