import {
  type AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { okAsync, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../../streaming/constants'
import type { Reasoning } from '../../../types'
import { streamLLMResponse } from '../../../utils/streamingLlmUtils'
import { reasoningSchema } from '../../../utils/validationSchema'
import type { ToolConfigurable } from '../../getToolConfigurable'
import { schemaDesignTool } from '../../tools/schemaDesignTool'
import { type DesignAgentPromptVariables, designAgentPrompt } from './prompt'

const AGENT_NAME = 'db' as const

const model = new ChatOpenAI({
  model: 'gpt-5',
  reasoning: { effort: 'medium', summary: 'detailed' },
  useResponsesApi: true,
}).bindTools([schemaDesignTool], {
  strict: true,
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
    model.stream([new SystemMessage(systemPrompt), ...messages], {
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
