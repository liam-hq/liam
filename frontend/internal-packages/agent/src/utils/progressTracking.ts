import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessageChunk } from '@langchain/core/messages'
import { SSE_EVENTS } from '../streaming/constants'

type ProgressEventData = {
  completed: number
  total: number
  message?: string
}

type BatchStartEventData = {
  total: number
  message: string
}

type BatchCompleteEventData = {
  total: number
  message: string
}

/**
 * Dispatch a progress event to track batch processing progress
 */
export async function dispatchProgressEvent(
  data: ProgressEventData,
  agentName: string,
): Promise<void> {
  const chunk = new AIMessageChunk({
    id: crypto.randomUUID(),
    name: agentName,
    content: '',
    additional_kwargs: {
      progress: data,
    },
  })
  await dispatchCustomEvent(SSE_EVENTS.PROGRESS, chunk)
}

/**
 * Dispatch a batch start event to indicate beginning of batch processing
 */
export async function dispatchBatchStartEvent(
  data: BatchStartEventData,
  agentName: string,
): Promise<void> {
  const chunk = new AIMessageChunk({
    id: crypto.randomUUID(),
    name: agentName,
    content: '',
    additional_kwargs: {
      batch_start: data,
    },
  })
  await dispatchCustomEvent(SSE_EVENTS.BATCH_START, chunk)
}

/**
 * Dispatch a batch complete event to indicate completion of batch processing
 */
export async function dispatchBatchCompleteEvent(
  data: BatchCompleteEventData,
  agentName: string,
): Promise<void> {
  const chunk = new AIMessageChunk({
    id: crypto.randomUUID(),
    name: agentName,
    content: '',
    additional_kwargs: {
      batch_complete: data,
    },
  })
  await dispatchCustomEvent(SSE_EVENTS.BATCH_COMPLETE, chunk)
}
