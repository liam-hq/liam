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
import type { Reasoning, WorkflowConfigurable } from '../types'
import { removeReasoningFromMessages } from '../utils/messageCleanup'
import { streamLLMResponse } from '../utils/streamingLlmUtils'
import { reasoningSchema } from '../utils/validationSchema'
import {
  type PmAnalysisPromptVariables,
  pmAnalysisPrompt,
} from './prompts/pmAnalysisPrompts'
import { saveRequirementsToArtifactTool } from './tools/saveRequirementsToArtifactTool'

const AGENT_NAME = 'pm' as const

type AnalysisWithReasoning = {
  response: AIMessage
  reasoning: Reasoning | null
}

/**
 * Invoke PM Analysis Agent to analyze user requirements and extract structured BRDs
 * This function replaces the PMAnalysisAgent class with a simpler functional approach
 */
export const invokePmAnalysisAgent = (
  variables: PmAnalysisPromptVariables,
  messages: BaseMessage[],
  configurable: WorkflowConfigurable,
): ResultAsync<AnalysisWithReasoning, Error> => {
  const cleanedMessages = removeReasoningFromMessages(messages)

  const formatPrompt = ResultAsync.fromSafePromise(
    pmAnalysisPrompt.format(variables),
  )

  const anthropic = new ChatAnthropic({
    model: 'claude-4-opus-20250514',
    streaming: true,
    maxTokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 8000,
    },
  }).bindTools([saveRequirementsToArtifactTool])

  const stream = fromAsyncThrowable((systemPrompt: string) => {
    return anthropic.stream(
      [new SystemMessage(systemPrompt), ...cleanedMessages],
      {
        configurable,
      },
    )
  })

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
      const parsed = v.safeParse(
        reasoningSchema,
        response.additional_kwargs['reasoning'],
      )
      const reasoning = parsed.success ? parsed.output : null

      return okAsync({
        response,
        reasoning,
      })
    })
}
