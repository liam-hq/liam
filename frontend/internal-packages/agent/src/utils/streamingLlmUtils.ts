import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessage, AIMessageChunk } from '@langchain/core/messages'
import { SSE_EVENTS } from '../streaming/constants'

/**
 * Options for streaming LLM response processing
 */
type StreamLLMOptions = {
  /** Name to assign to the agent (e.g., 'lead', 'qa-agent', 'pm-agent') */
  agentName: string
  /** Event type for dispatching chunks. Defaults to SSE_EVENTS.MESSAGES */
  eventType?: string
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
  let accumulatedChunk: AIMessageChunk | null = null

  for await (const _chunk of stream) {
    const chunk = new AIMessageChunk({ ..._chunk, id, name: agentName })
    await dispatchCustomEvent(eventType, chunk)

    accumulatedChunk = accumulatedChunk ? accumulatedChunk.concat(chunk) : chunk
  }

  const response = accumulatedChunk
    ? new AIMessage({
        id,
        content: accumulatedChunk.content,
        additional_kwargs: accumulatedChunk.additional_kwargs,
        name: agentName,
        ...(accumulatedChunk.tool_calls && {
          tool_calls: accumulatedChunk.tool_calls,
        }),
      })
    : new AIMessage({ id, content: '', name: agentName })

  return response
}
