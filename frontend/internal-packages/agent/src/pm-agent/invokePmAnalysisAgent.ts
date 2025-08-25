import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import {
  AIMessage,
  AIMessageChunk,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { WorkflowConfigurable } from '../chat/workflow/types'
import { reasoningSchema } from '../langchain/utils/schema'
import type { Reasoning } from '../langchain/utils/types'
import { removeReasoningFromMessages } from '../utils/messageCleanup'
import {
  type PmAnalysisPromptVariables,
  pmAnalysisPrompt,
} from './prompts/pmAnalysisPrompts'
import { saveRequirementsToArtifactTool } from './tools/saveRequirementsToArtifactTool'

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

  const invoke = ResultAsync.fromThrowable(
    (systemPrompt: string) =>
      model.stream([new SystemMessage(systemPrompt), ...cleanedMessages], {
        configurable,
      }),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return formatPrompt.andThen(invoke).andThen((stream) => {
    return ResultAsync.fromPromise(
      (async () => {
        // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
        // so we overwrite with a UUID to unify chunk ids for consistent handling.
        const id = crypto.randomUUID()
        let accumulatedChunk: AIMessageChunk | null = null

        for await (const _chunk of stream) {
          const chunk = new AIMessageChunk({ ..._chunk, id, name: 'pm' })
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
