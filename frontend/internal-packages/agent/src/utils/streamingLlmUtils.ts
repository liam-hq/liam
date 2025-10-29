import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessage, AIMessageChunk } from '@langchain/core/messages'
import { SSE_EVENTS } from '../streaming/constants'

type MessageLevel = 'VERBOSE' | 'NORMAL' | 'QUIET'

type StreamLLMOptions = {
  agentName: string
  eventType?: string
  messageLevel?: MessageLevel
}

type ProcessStreamResult = {
  chunk: AIMessageChunk | null
  reasoningDurationMs: number | null
}

/**
 * Dispatch each chunk as soon as it arrives while also accumulating
 * the content into a single `AIMessageChunk` for final post-processing.
 *
 * Returns the accumulated chunk, or `null` if the stream yields no chunks.
 */
async function processStreamWithImmediateDispatch(
  stream: AsyncIterable<AIMessageChunk>,
  id: string,
  agentName: string,
  eventType: string,
): Promise<ProcessStreamResult> {
  let accumulatedChunk: AIMessageChunk | null = null
  let reasoningStartTime: number | null = null
  let reasoningEndTime: number | null = null

  for await (const _chunk of stream) {
    const chunk = new AIMessageChunk({ ..._chunk, id, name: agentName })

    // NOTE: Track reasoning duration internally but DON'T set it on chunks
    // to avoid "field already exists" errors when LangGraph internally merges chunks
    if (chunk.additional_kwargs?.['reasoning']) {
      if (!reasoningStartTime) {
        reasoningStartTime = Date.now()
      }
      reasoningEndTime = Date.now()
    }

    await dispatchCustomEvent(eventType, chunk)

    accumulatedChunk = accumulatedChunk ? accumulatedChunk.concat(chunk) : chunk
  }

  const finalReasoningDurationMs =
    reasoningStartTime && reasoningEndTime
      ? reasoningEndTime - reasoningStartTime
      : null

  if (finalReasoningDurationMs !== null) {
    const durationChunk = new AIMessageChunk({
      id,
      name: agentName,
      content: '',
      additional_kwargs: {
        reasoning_duration_ms: finalReasoningDurationMs,
      },
    })
    await dispatchCustomEvent(eventType, durationChunk)
  }

  return {
    chunk: accumulatedChunk,
    reasoningDurationMs: finalReasoningDurationMs,
  }
}

async function processStreamQuietly(
  stream: AsyncIterable<AIMessageChunk>,
  id: string,
  agentName: string,
): Promise<ProcessStreamResult> {
  let accumulatedChunk: AIMessageChunk | null = null
  let reasoningStartTime: number | null = null
  let reasoningEndTime: number | null = null

  for await (const _chunk of stream) {
    const chunk = new AIMessageChunk({ ..._chunk, id, name: agentName })

    if (chunk.additional_kwargs?.['reasoning']) {
      if (!reasoningStartTime) {
        reasoningStartTime = Date.now()
      }
      reasoningEndTime = Date.now()
    }

    accumulatedChunk = accumulatedChunk ? accumulatedChunk.concat(chunk) : chunk
  }

  const reasoningDurationMs =
    reasoningStartTime && reasoningEndTime
      ? reasoningEndTime - reasoningStartTime
      : null

  return {
    chunk: accumulatedChunk,
    reasoningDurationMs,
  }
}

function buildAIMessage(
  id: string,
  agentName: string,
  accumulatedChunk: AIMessageChunk | null,
  reasoningDurationMs: number | null,
): AIMessage {
  if (!accumulatedChunk) {
    return new AIMessage({ id, content: '', name: agentName })
  }

  return new AIMessage({
    id,
    content: accumulatedChunk.content,
    additional_kwargs: {
      ...accumulatedChunk.additional_kwargs,
      ...(reasoningDurationMs !== null && {
        reasoning_duration_ms: reasoningDurationMs,
      }),
    },
    name: agentName,
    ...(accumulatedChunk.tool_calls && {
      tool_calls: accumulatedChunk.tool_calls,
    }),
  })
}

/**
 * Process a streaming LLM response with chunk accumulation and event dispatching
 */
export async function streamLLMResponse(
  stream: AsyncIterable<AIMessageChunk>,
  options: StreamLLMOptions,
): Promise<AIMessage> {
  const {
    agentName,
    eventType = SSE_EVENTS.MESSAGES,
    messageLevel = 'NORMAL',
  } = options

  const id = crypto.randomUUID()

  if (messageLevel === 'QUIET') {
    const { chunk: accumulatedChunk, reasoningDurationMs } =
      await processStreamQuietly(stream, id, agentName)
    return buildAIMessage(id, agentName, accumulatedChunk, reasoningDurationMs)
  }

  const { chunk: accumulatedChunk, reasoningDurationMs } =
    await processStreamWithImmediateDispatch(stream, id, agentName, eventType)

  return buildAIMessage(id, agentName, accumulatedChunk, reasoningDurationMs)
}
