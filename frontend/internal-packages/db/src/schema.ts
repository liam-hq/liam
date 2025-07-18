import * as v from 'valibot'
import type { Json, Tables } from '../supabase/database.types'

export const jsonSchema: v.GenericSchema<Json> = v.lazy(() =>
  v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.record(v.string(), v.optional(jsonSchema)),
    v.array(jsonSchema),
  ]),
)

export const buildingSchemaVersionsSchema: v.GenericSchema<
  Tables<'building_schema_versions'>
> = v.object({
  id: v.pipe(v.string(), v.uuid()),
  number: v.number(),
  building_schema_id: v.pipe(v.string(), v.uuid()),
  patch: v.nullable(jsonSchema),
  created_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
  reverse_patch: v.nullable(jsonSchema),
})

export const workflowRunsSchema: v.GenericSchema<Tables<'workflow_runs'>> =
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    workflow_run_id: v.pipe(v.string(), v.uuid()),
    design_session_id: v.pipe(v.string(), v.uuid()),
    organization_id: v.pipe(v.string(), v.uuid()),
    status: v.picklist(['pending', 'success', 'error']),
    created_at: v.string(),
    updated_at: v.string(),
  })

export const timelineItemsSchema: v.GenericSchema<Tables<'timeline_items'>> =
  v.object({
    id: v.string(),
    design_session_id: v.pipe(v.string(), v.uuid()),
    content: v.string(),
    type: v.picklist([
      'user',
      'assistant',
      'schema_version',
      'error',
      'assistant_log',
    ]),
    assistant_role: v.nullable(v.picklist(['db', 'pm', 'qa'])),
    user_id: v.nullable(v.pipe(v.string(), v.uuid())),
    created_at: v.string(),
    updated_at: v.string(),
    organization_id: v.pipe(v.string(), v.uuid()),
    building_schema_version_id: v.nullable(v.pipe(v.string(), v.uuid())),
  })
