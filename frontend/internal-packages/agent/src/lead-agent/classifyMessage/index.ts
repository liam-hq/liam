import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import {
  AIMessage,
  AIMessageChunk,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { Command, END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { SSE_EVENTS } from '../../client'
import type { WorkflowConfigurable, WorkflowState } from '../../types'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { getConfigurable } from '../../utils/getConfigurable'
import { routeToAgent } from '../tools/routeToAgent'
import { isQACompleted } from '../utils/workflowStatus'
import { prompt } from './prompt'

const AGENT_NAME = 'lead' as const

export async function classifyMessage(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<Command> {
  // 1. Check if QA is completed first (highest priority)
  if (isQACompleted(state)) {
    return new Command({ goto: 'summarizeWorkflow' })
  }

  // 2. Analyze initial request with LLM
  const model = new ChatOpenAI({
    model: 'gpt-5-nano',
  }).bindTools([routeToAgent], {
    parallel_tool_calls: false,
    tool_choice: 'auto',
  })

  const invoke = fromAsyncThrowable((configurable: WorkflowConfigurable) => {
    return model.stream([new SystemMessage(prompt), ...state.messages], {
      configurable,
    })
  })

  const result = await getConfigurable(config)
    .asyncAndThen(invoke)
    .andThen((stream) => {
      return ResultAsync.fromPromise(
        (async () => {
          // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
          // so we overwrite with a UUID to unify chunk ids for consistent handling.
          const id = uuidv4()
          let accumulatedChunk: AIMessageChunk | null = null

          for await (const _chunk of stream) {
            const chunk = new AIMessageChunk({
              ..._chunk,
              id,
              name: AGENT_NAME,
            })
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
            : new AIMessage({ id, name: AGENT_NAME, content: '' })

          return response
        })(),
        (error) => (error instanceof Error ? error : new Error(String(error))),
      )
    })

  if (result.isErr()) {
    throw new WorkflowTerminationError(result.error, 'classifyMessage')
  }

  const response = result.value

  // 3. Check if database design request (tool call to routeToAgent)
  if (response.tool_calls?.[0]?.name === 'routeToAgent') {
    // Create ToolMessage to properly complete the tool call
    const id = uuidv4()
    const toolMessage = new ToolMessage({
      id,
      status: 'success',
      content: response.tool_calls[0].args?.['targetAgent'] || 'pmAgent',
      tool_call_id: response.tool_calls[0].id ?? '',
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    // Route to PM Agent with both the AI response and tool completion
    return new Command({
      update: {
        messages: [response, toolMessage],
        next: 'pmAgent',
      },
      goto: END,
    })
  }

  // 4. Regular response without routing
  return new Command({
    update: {
      messages: [response],
      next: END,
    },
    goto: END,
  })
}
