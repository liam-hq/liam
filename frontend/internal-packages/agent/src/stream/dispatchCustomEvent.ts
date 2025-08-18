import { dispatchCustomEvent as _dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import type { AIMessageChunk } from '@langchain/core/messages'
import type { AssistantRole, EventType } from './schemas'

export async function dispatchCustomEvent(
  role: AssistantRole,
  eventType: EventType,
  chunk: AIMessageChunk,
): Promise<void> {
  await _dispatchCustomEvent(`${role}:${eventType}`, chunk)
}
