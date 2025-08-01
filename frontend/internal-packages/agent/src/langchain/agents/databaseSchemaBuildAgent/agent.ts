import {
  AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { ToolConfigurable } from '../../../db-agent/getToolConfigurable'
import { schemaDesignTool } from '../../../db-agent/tools/schemaDesignTool'
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompts'

const model = new ChatOpenAI({
  model: 'o4-mini',
  reasoning: { effort: 'high', summary: 'detailed' },
  useResponsesApi: true,
}).bindTools([schemaDesignTool], { parallel_tool_calls: false })

type DesignAgentResult = {
  response: AIMessage
  reasoning: Reasoning | null
}

const MAX_RETRIES = 3

const invokeModelWithRetry = async (
  systemPrompt: string,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
  retryCount = 0,
): Promise<AIMessage> => {
  // Debug: Log messages before invoke
  if (process.env['NODE_ENV'] !== 'production') {
    // biome-ignore lint/suspicious/noConsole: Debug logging
    console.log('[DEBUG] Before invoke - Message count:', messages.length)
  }

  const result = await ResultAsync.fromPromise(
    model.invoke([new SystemMessage(systemPrompt), ...messages], {
      configurable,
    }),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  if (result.isErr()) {
    const errorMessage = result.error.message

    // Check for tool call synchronization error
    if (
      errorMessage.includes('No tool call found for function call output') &&
      retryCount < MAX_RETRIES - 1
    ) {
      // Extract call_id from error message for debugging
      const callIdMatch = errorMessage.match(/call_id\s+(\w+)/)
      const callId = callIdMatch ? callIdMatch[1] : 'unknown'

      // Log warning for debugging (production logging should be handled by the app)
      if (process.env['NODE_ENV'] !== 'production') {
        // biome-ignore lint/suspicious/noConsole: Debug logging in non-production
        console.warn(
          `[DEBUG] Tool call sync error detected (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
          {
            callId,
            errorMessage,
            messageCount: messages.length,
            hasToolCalls: messages.some(
              (msg) =>
                'tool_calls' in msg &&
                Array.isArray(msg.tool_calls) &&
                msg.tool_calls.length > 0,
            ),
            retryingWithFilteredMessages: true,
          },
        )
      }

      // Wait with exponential backoff
      const delay = 2 ** retryCount * 1000 // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay))

      // On retry, use fresh messages without any pending tool calls
      const freshMessages = messages.filter((msg) => {
        // Keep all non-AI messages
        if (!(msg instanceof AIMessage)) return true
        // Keep AI messages without tool calls
        if (
          !('tool_calls' in msg) ||
          !msg.tool_calls ||
          msg.tool_calls.length === 0
        )
          return true
        // Skip AI messages with tool calls to avoid sync issues
        return false
      })

      if (process.env['NODE_ENV'] !== 'production') {
        // biome-ignore lint/suspicious/noConsole: Debug logging in non-production
        console.log(
          `Retrying with ${freshMessages.length} messages (filtered from ${messages.length})`,
        )
      }

      // Retry with fresh messages
      return invokeModelWithRetry(
        systemPrompt,
        freshMessages,
        configurable,
        retryCount + 1,
      )
    }

    // Return the error for non-retryable cases
    throw result.error
  }

  // Debug: Log successful response
  if (
    process.env['NODE_ENV'] !== 'production' &&
    result.value.tool_calls &&
    result.value.tool_calls.length > 0
  ) {
    // biome-ignore lint/suspicious/noConsole: Debug logging
    console.log('[DEBUG] AI Response with tool calls:', {
      toolCallCount: result.value.tool_calls.length,
      toolCalls: result.value.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        args: tc.args,
      })),
    })
  }

  return result.value
}

export const invokeDesignAgent = (
  variables: DesignAgentPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<DesignAgentResult, Error> => {
  const formatPrompt = ResultAsync.fromSafePromise(
    designAgentPrompt.format(variables),
  )

  const invoke = (systemPrompt: string) =>
    ResultAsync.fromPromise(
      invokeModelWithRetry(systemPrompt, messages, configurable),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )

  return formatPrompt.andThen(invoke).andThen((response) => {
    const parsedReasoning = v.safeParse(
      reasoningSchema,
      response.additional_kwargs['reasoning'],
    )
    const reasoning = parsedReasoning.success ? parsedReasoning.output : null

    return ok({
      response,
      reasoning,
    })
  })
}
