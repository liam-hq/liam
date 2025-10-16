import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessage, AIMessageChunk } from '@langchain/core/messages'
import { SSE_EVENTS } from '../streaming/constants'

type StreamLLMOptions = {
  agentName: string
  eventType?: string
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

    if (chunk.additional_kwargs?.['reasoning']) {
      if (!reasoningStartTime) {
        reasoningStartTime = Date.now()
      }
      reasoningEndTime = Date.now()

      const currentDurationMs = reasoningEndTime - reasoningStartTime

      chunk.additional_kwargs['reasoning_duration_ms'] = currentDurationMs
    }

    await dispatchCustomEvent(eventType, chunk)

    // NOTE: Create a new chunk without reasoning_duration_ms for concat to avoid "field already exists" warning
    const savedDurationMs = chunk.additional_kwargs?.['reasoning_duration_ms']

    let chunkForConcat = chunk
    if (savedDurationMs !== undefined) {
      // biome-ignore lint/correctness/noUnusedVariables: Intentionally extracting to exclude from spread
      const { reasoning_duration_ms, ...otherKwargs } = chunk.additional_kwargs
      chunkForConcat = new AIMessageChunk({
        ...chunk,
        additional_kwargs: otherKwargs,
      })
    }

    accumulatedChunk = accumulatedChunk
      ? accumulatedChunk.concat(chunkForConcat)
      : chunk

    // NOTE: Set the latest reasoning_duration_ms after concat
    if (savedDurationMs !== undefined) {
      accumulatedChunk.additional_kwargs = {
        ...accumulatedChunk.additional_kwargs,
        reasoning_duration_ms: savedDurationMs,
      }
    }
  }

  const finalReasoningDurationMs =
    reasoningStartTime && reasoningEndTime
      ? reasoningEndTime - reasoningStartTime
      : null

  return {
    chunk: accumulatedChunk,
    reasoningDurationMs: finalReasoningDurationMs,
  }
}

/**
 * Process a streaming LLM response with chunk accumulation and event dispatching
 */
export async function streamLLMResponse(
  stream: AsyncIterable<AIMessageChunk>,
  options: StreamLLMOptions,
): Promise<AIMessage> {
  const { agentName, eventType = SSE_EVENTS.MESSAGES } = options

  // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
  // so we overwrite with a UUID to unify chunk ids for consistent handling.
  const id = crypto.randomUUID()

  // All agents currently use immediate dispatch. If a provider streams
  // tool_calls incrementally, the final message is reconstructed from
  // the accumulated chunk below.
  const { chunk: accumulatedChunk, reasoningDurationMs } =
    await processStreamWithImmediateDispatch(stream, id, agentName, eventType)

  const response = accumulatedChunk
    ? new AIMessage({
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
    : new AIMessage({ id, content: '', name: agentName })

  return response
}
