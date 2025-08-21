import type { Database, Tables } from '@liam-hq/db'

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
  | 'query_result_id'
> & {
  users?: {
    id: string
    name: string
    email: string
  } | null
  building_schema_versions?: {
    id: string
    number: number
    patch: Database['public']['Tables']['building_schema_versions']['Row']['patch']
  } | null
  validation_queries?: {
    id: string
    query_string: string
    validation_results?: Array<{
      id: string
      result_set: unknown[] | null
      status: string
      error_message: string | null
      executed_at: string
    }>
  } | null
  // TODO: Backend needs to add artifact_action field to timeline_items table
  // This field should be set to 'created' when PM agent creates requirements artifact
  // and 'updated' when QA agent adds use cases to the artifact
  artifact_action?: 'created' | 'updated' | null
}

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
  type:
    | 'user'
    | 'assistant'
    | 'schema_version'
    | 'error'
    | 'assistant_log'
    | 'query_result'
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

export type ErrorTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'error'
  onRetry?: () => void
}

export type AssistantLogTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_log'
  role: AssistantRole
}

export type QueryResultTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'query_result'
  queryResultId: string
  results: unknown
}

export type TimelineItemEntry =
  | UserTimelineItemEntry
  | AssistantTimelineItemEntry
  | SchemaVersionTimelineItemEntry
  | ErrorTimelineItemEntry
  | AssistantLogTimelineItemEntry
  | QueryResultTimelineItemEntry
