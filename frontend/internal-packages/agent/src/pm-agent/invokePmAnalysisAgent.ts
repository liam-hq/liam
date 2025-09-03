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
import type { Reasoning, WorkflowConfigurable } from '../types'
import { removeReasoningFromMessages } from '../utils/messageCleanup'
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

  const model = new ChatOpenAI({
    model: 'gpt-5',
    reasoning: { effort: 'medium', summary: 'detailed' },
    useResponsesApi: true,
    streaming: true,
  }).bindTools(
    [{ type: 'web_search_preview' }, saveRequirementsToArtifactTool],
    {
      parallel_tool_calls: false,
      tool_choice: 'required',
    },
  )

  const invoke = fromAsyncThrowable((systemPrompt: string) =>
    model.stream([new SystemMessage(systemPrompt), ...cleanedMessages], {
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

        const parsed = v.safeParse(
          reasoningSchema,
          accumulatedChunk?.additional_kwargs['reasoning'],
        )
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
