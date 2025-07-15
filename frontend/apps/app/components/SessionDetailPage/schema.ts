import * as v from 'valibot'

// TODO: Make sure to use it when storing data and as an inferential type
export const timelineItemSchema = v.object({
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
  user_id: v.nullable(v.pipe(v.string(), v.uuid())),
  created_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
  building_schema_version_id: v.nullable(v.pipe(v.string(), v.uuid())),
})
