import { AIMessageChunk } from '@langchain/core/messages'
import type { StreamEvent } from '@langchain/core/tracers/log_stream'
import * as v from 'valibot'
import {
  type CustomStreamEvent,
  eventTypeSchema,
  isAssistantRole,
} from './schemas'

export function transformEvent(event: StreamEvent): CustomStreamEvent | null {
  if (event.event !== 'on_custom_event') return null

  const parts = event.name.split(':')
  if (parts.length !== 2) return null

  const [role, eventType] = parts
  if (role === undefined || eventType === undefined) return null

  if (!isAssistantRole(role)) return null

  const chunk = event.data
  if (!(chunk instanceof AIMessageChunk)) return null

  const eventTypeResult = v.safeParse(eventTypeSchema, eventType)
  if (!eventTypeResult.success) return null

  const validEventType = eventTypeResult.output

  const baseData = {
    runId: event.run_id || '',
    role,
    content: chunk.text,
  }

  return {
    event: validEventType,
    data: baseData,
  }
}
