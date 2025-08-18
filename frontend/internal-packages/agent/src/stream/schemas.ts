import type { Database } from '@liam-hq/db'
import * as v from 'valibot'

const assistantRoleSchema: v.GenericSchema<
  Database['public']['Enums']['assistant_role_enum']
> = v.lazy(() => v.picklist(['db', 'pm', 'qa']))

export type AssistantRole = v.InferOutput<typeof assistantRoleSchema>

export function isAssistantRole(value: unknown): value is AssistantRole {
  return v.safeParse(assistantRoleSchema, value).success
}

const baseStreamEventDataSchema = v.object({
  runId: v.string(),
  content: v.string(),
})

const deltaStreamEventSchema = v.object({
  event: v.literal('delta'),
  data: v.object({
    ...baseStreamEventDataSchema.entries,
    role: assistantRoleSchema,
  }),
})

const messageStreamEventSchema = v.object({
  event: v.literal('message'),
  data: v.object({
    ...baseStreamEventDataSchema.entries,
    role: assistantRoleSchema,
  }),
})

export const customStreamEventSchema = v.variant('event', [
  deltaStreamEventSchema,
  messageStreamEventSchema,
])

export type CustomStreamEvent = v.InferOutput<typeof customStreamEventSchema>

export type EventType = CustomStreamEvent['event']

export const eventTypeSchema: v.GenericSchema<EventType> = v.lazy(() =>
  v.picklist(['delta', 'message']),
)
