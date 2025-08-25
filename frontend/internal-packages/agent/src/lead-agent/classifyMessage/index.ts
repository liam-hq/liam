import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import {
  AIMessage,
  AIMessageChunk,
  SystemMessage,
} from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { END } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowConfigurable } from '../../chat/workflow/types'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { LeadAgentState } from '../annotation'
import { routeToAgent } from '../tools/routeToAgent'
import { prompt } from './prompt'
import { hasToolCalls } from './utils'

const model = new ChatOpenAI({
  model: 'gpt-5-nano',
}).bindTools([routeToAgent], {
  parallel_tool_calls: false,
  tool_choice: 'auto',
})

export async function classifyMessage(
  state: LeadAgentState,
  config: RunnableConfig,
): Promise<Partial<LeadAgentState>> {
  const invoke = ResultAsync.fromThrowable(
    (configurable: WorkflowConfigurable) => {
      return model.stream([new SystemMessage(prompt), ...state.messages], {
        configurable,
      })
    },
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  const result = await getConfigurable(config)
    .asyncAndThen(invoke)
    .andThen((stream) => {
      return ResultAsync.fromPromise(
        (async () => {
          // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
          // so we overwrite with a UUID to unify chunk ids for consistent handling.
          const id = crypto.randomUUID()
          let accumulatedChunk: AIMessageChunk | null = null

          for await (const _chunk of stream) {
            const chunk = new AIMessageChunk({ ..._chunk, id, name: 'lead' })
            await dispatchCustomEvent('messages', chunk)

            // Accumulate chunks using concat method
            accumulatedChunk = accumulatedChunk
              ? accumulatedChunk.concat(chunk)
              : chunk
          }

          // Convert the final accumulated chunk to AIMessage
          const response = accumulatedChunk
            ? new AIMessage({
                content: accumulatedChunk.content,
                additional_kwargs: accumulatedChunk.additional_kwargs,
                ...(accumulatedChunk.tool_calls && {
                  tool_calls: accumulatedChunk.tool_calls,
                }),
                ...(accumulatedChunk.name && { name: accumulatedChunk.name }),
              })
            : new AIMessage('')

          return response
        })(),
        (error) => (error instanceof Error ? error : new Error(String(error))),
      )
    })

  if (result.isErr()) {
    throw new WorkflowTerminationError(result.error, 'classifyMessage')
  }

  const response = result.value

  if (!hasToolCalls(response)) {
    return {
      messages: [response],
      next: END,
    }
  }

  return {
    messages: [response],
  }
}

export const toolNode = new ToolNode([routeToAgent])
