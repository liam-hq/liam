import { ChatAnthropic } from '@langchain/anthropic'
import {
  type AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { okAsync, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { SSE_EVENTS } from '../client'
import type { Reasoning } from '../types'
import { streamLLMResponse } from '../utils/streamingLlmUtils'
import { reasoningSchema } from '../utils/validationSchema'
import type { ToolConfigurable } from './getToolConfigurable'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompt'
import { schemaDesignTool } from './tools/schemaDesignTool'

const AGENT_NAME = 'db' as const

const anthropic = new ChatAnthropic({
  model: 'claude-4-opus-20250514',
  streaming: true,
  maxTokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 8000,
  },
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
  const stream = fromAsyncThrowable((systemPrompt: string) =>
    anthropic.stream([new SystemMessage(systemPrompt), ...messages], {
      configurable,
    }),
  )

  const response = fromAsyncThrowable((stream: AsyncIterable<AIMessageChunk>) =>
    streamLLMResponse(stream, {
      agentName: AGENT_NAME,
      eventType: SSE_EVENTS.MESSAGES,
    }),
  )

  return formatPrompt
    .andThen(stream)
    .andThen(response)
    .andThen((response) => {
      const reasoningPayload = response.additional_kwargs?.['reasoning']
      const parsed = v.safeParse(reasoningSchema, reasoningPayload)
      const reasoning = parsed.success ? parsed.output : null

      return okAsync({ response, reasoning })
    })
}
