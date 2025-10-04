import {
  type AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { okAsync, type ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { SSE_EVENTS } from '../streaming/constants'
import type { Reasoning, WorkflowConfigurable } from '../types'
import { removeReasoningFromMessages } from '../utils/messageCleanup'
import { streamLLMResponse } from '../utils/streamingLlmUtils'
import { reasoningSchema } from '../utils/validationSchema'
import {
  createPmAnalysisPrompt,
  type PmAnalysisPromptVariables,
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

  const systemPrompt = createPmAnalysisPrompt(variables)

  const model = new ChatOpenAI({
    model: 'gpt-5',
    reasoning: { effort: 'medium', summary: 'detailed' },
    useResponsesApi: true,
    streaming: true,
  }).bindTools(
    [{ type: 'web_search_preview' }, saveRequirementsToArtifactTool],
    {
      parallel_tool_calls: false,
      strict: true,
      tool_choice: 'required',
    },
  )

  const stream = fromAsyncThrowable(() =>
    model.stream([new SystemMessage(systemPrompt), ...cleanedMessages], {
      configurable,
    }),
  )

  const response = fromAsyncThrowable((stream: AsyncIterable<AIMessageChunk>) =>
    streamLLMResponse(stream, {
      agentName: AGENT_NAME,
      eventType: SSE_EVENTS.MESSAGES,
    }),
  )

  return stream()
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
