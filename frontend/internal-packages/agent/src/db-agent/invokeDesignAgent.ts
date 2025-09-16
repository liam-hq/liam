import {
  type AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
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

const resolveDbEffortFromEnv = (): 'off' | 'low' | 'medium' | 'high' => {
  const raw = (process.env['LIAM_DB_EFFORT'] || '').trim().toLowerCase()
  if (!raw) return 'low' // default stays as before
  if (raw === 'off' || raw === 'none' || raw === 'disabled') return 'off'
  if (raw === 'minimal' || raw === 'low') return 'low'
  if (raw === 'medium') return 'medium'
  if (raw === 'high' || raw === 'max' || raw === 'maximum') return 'high'
  console.warn(
    `[liam-db] Unknown LIAM_DB_EFFORT="${raw}". Falling back to off. Allowed: off|minimal|low|medium|high`,
  )
  return 'off'
}

type DesignAgentResult = {
  response: AIMessage
  reasoning: Reasoning | null
}

export const invokeDesignAgent = (
  variables: ContextPromptVariables,
  messages: BaseMessage[],
  configurable: ToolConfigurable,
): ResultAsync<DesignAgentResult, Error> => {
  const effort = resolveDbEffortFromEnv()
  const base = {
    model: 'gpt-5',
    useResponsesApi: true,
  } as const
  const model =
    effort === 'off'
      ? new ChatOpenAI(base)
      : new ChatOpenAI({ ...base, reasoning: { effort, summary: 'detailed' } })
  const bound = model.bindTools([schemaDesignTool], { strict: true })
  const formatContextPrompt = ResultAsync.fromSafePromise(
    contextPromptTemplate.format(variables),
  )

  const stream = fromAsyncThrowable((contextPrompt: string) =>
    bound.stream(
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
