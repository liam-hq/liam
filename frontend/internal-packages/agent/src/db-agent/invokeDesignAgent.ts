import {
  type AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { createChatOpenAI } from '../utils/createChatOpenAI'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { okAsync, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { SSE_EVENTS } from '../streaming/constants'
import type { Reasoning } from '../types'
import { streamLLMResponse } from '../utils/streamingLlmUtils'
import { reasoningSchema } from '../utils/validationSchema'
import type { ToolConfigurable } from './getToolConfigurable'
import {
  type ContextPromptVariables,
  contextPromptTemplate,
  SYSTEM_PROMPT,
} from './prompt'
import { schemaDesignTool } from './tools/schemaDesignTool'

const AGENT_NAME = 'db' as const

const model = createChatOpenAI({
  model: 'gpt-5-mini',
  reasoning: { effort: 'low', summary: 'detailed' },
  useResponsesApi: true,
}).bindTools([schemaDesignTool], {
  strict: true,
  tool_choice: schemaDesignTool.name,
})

type DesignAgentResult = {
  response: AIMessage
  reasoning: Reasoning | null
}

export const invokeDesignAgent = (
  variables: ContextPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<DesignAgentResult, Error> => {
  const formatContextPrompt = ResultAsync.fromSafePromise(
    contextPromptTemplate.format(variables),
  )

  const stream = fromAsyncThrowable((contextPrompt: string) =>
    model.stream(
      [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(contextPrompt),
        ...messages,
      ],
      { configurable },
    ),
  )

  const response = fromAsyncThrowable((stream: AsyncIterable<AIMessageChunk>) =>
    streamLLMResponse(stream, {
      agentName: AGENT_NAME,
      eventType: SSE_EVENTS.MESSAGES,
    }),
  )

  return formatContextPrompt
    .andThen(stream)
    .andThen(response)
    .andThen((response) => {
      const reasoningPayload = response.additional_kwargs?.['reasoning']
      const parsed = v.safeParse(reasoningSchema, reasoningPayload)
      const reasoning = parsed.success ? parsed.output : null

      return okAsync({ response, reasoning })
    })
}
