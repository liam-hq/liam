import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import {
  AIMessage,
  AIMessageChunk,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../client'
import type { Reasoning } from '../types'
import { reasoningSchema } from '../utils/validationSchema'
import type { ToolConfigurable } from './getToolConfigurable'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompt'
import { schemaDesignTool } from './tools/schemaDesignTool'

const AGENT_NAME = 'db' as const

const model = new ChatOpenAI({
  model: 'gpt-5',
  reasoning: { effort: 'medium', summary: 'detailed' },
  useResponsesApi: true,
}).bindTools([schemaDesignTool], {
  tool_choice: schemaDesignTool.name,
})

type DesignAgentResult = {
  response: AIMessage
  reasoning: Reasoning | null
}

export const invokeDesignAgent = (
  variables: DesignAgentPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<DesignAgentResult, Error> => {
  const formatPrompt = ResultAsync.fromSafePromise(
    designAgentPrompt.format(variables),
  )
  const invoke = fromAsyncThrowable((systemPrompt: string) =>
    model.stream([new SystemMessage(systemPrompt), ...messages], {
      configurable,
    }),
  )

  return formatPrompt.andThen(invoke).andThen((stream) => {
    return ResultAsync.fromPromise(
      (async () => {
        // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
        // so we overwrite with a UUID to unify chunk ids for consistent handling.
        const id = uuidv4()
        let accumulatedChunk: AIMessageChunk | null = null

        for await (const _chunk of stream) {
          const chunk = new AIMessageChunk({ ..._chunk, id, name: AGENT_NAME })
          await dispatchCustomEvent(SSE_EVENTS.MESSAGES, chunk)

          // Accumulate chunks using concat method
          accumulatedChunk = accumulatedChunk
            ? accumulatedChunk.concat(chunk)
            : chunk
        }

        // Convert the final accumulated chunk to AIMessage
        // Note: AIMessageChunk.concat() doesn't preserve the name field,
        // so we need to explicitly set it
        const response = accumulatedChunk
          ? new AIMessage({
              id,
              content: accumulatedChunk.content,
              additional_kwargs: accumulatedChunk.additional_kwargs,
              name: AGENT_NAME, // Always set name as concat() doesn't preserve it
              ...(accumulatedChunk.tool_calls && {
                tool_calls: accumulatedChunk.tool_calls,
              }),
            })
          : new AIMessage({ id, content: '', name: AGENT_NAME })

        const reasoningPayload =
          accumulatedChunk?.additional_kwargs?.['reasoning']
        const parsed = v.safeParse(reasoningSchema, reasoningPayload)
        const reasoning = parsed.success ? parsed.output : null

        return {
          response,
          reasoning,
        }
      })(),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )
  })
}
