import type { Database, Tables } from '@liam-hq/db'
import type * as v from 'valibot'
import type { timelineItemSchema } from './schema'

export type ReviewComment = {
  fromLine: number
  toLine: number
  severity: 'High' | 'Medium' | 'Low'
  message: string
}

export type Version = Pick<Tables<'building_schema_versions'>, 'id' | 'number'>

export type BuildingSchema = Pick<
  Tables<'building_schemas'>,
  'id' | 'schema' | 'initial_schema_snapshot'
>

export type TimelineItem = v.InferOutput<typeof timelineItemSchema>

export type DesignSessionWithTimelineItems = Pick<
  Tables<'design_sessions'>,
  'id' | 'organization_id'
> & {
  timeline_items: TimelineItem[]
}

export type WorkflowRunStatus =
  Database['public']['Enums']['workflow_run_status']

type BaseTimelineItemEntry = {
  id: string
  content: string
  type:
    | 'user'
    | 'assistant'
    | 'schema_version'
    | 'error'
    | 'assistant_log'
    | 'assistant_pm'
    | 'assistant_db'
    | 'assistant_qa'
  timestamp: Date
}

export type UserTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'user'
}

export type AssistantTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant'
}

export type SchemaVersionTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'schema_version'
  buildingSchemaVersionId: string
}

export type ErrorTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'error'
}

export type AssistantLogTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_log'
}

export type AssistantPmTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_pm'
}

export type AssistantDbTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_db'
}

export type AssistantQaTimelineItemEntry = BaseTimelineItemEntry & {
  type: 'assistant_qa'
}

export type TimelineItemEntry =
  | UserTimelineItemEntry
  | AssistantTimelineItemEntry
  | SchemaVersionTimelineItemEntry
  | ErrorTimelineItemEntry
  | AssistantLogTimelineItemEntry
  | AssistantPmTimelineItemEntry
  | AssistantDbTimelineItemEntry
  | AssistantQaTimelineItemEntry
