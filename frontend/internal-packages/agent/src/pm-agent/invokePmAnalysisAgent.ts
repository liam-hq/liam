import {
  AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { WorkflowConfigurable } from '../chat/workflow/types'
import { reasoningSchema } from '../langchain/utils/schema'
import type { Reasoning } from '../langchain/utils/types'
import { dispatchCustomEvent } from '../stream/dispatchCustomEvent'
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
        const contentParts: string[] = []
        let finalKwargs: Record<string, unknown> = {}
        let latestReasoningRaw: unknown = null

        for await (const chunk of stream) {
          await dispatchCustomEvent('pm', 'delta', chunk)

          if (Array.isArray(chunk.content)) {
            for (const part of chunk.content) {
              if (part.type === 'text') {
                contentParts.push(part.text)
              }
            }
          } else if (typeof chunk.content === 'string') {
            contentParts.push(chunk.content)
          }
          finalKwargs = { ...finalKwargs, ...chunk.additional_kwargs }

          if (chunk.additional_kwargs['reasoning'] !== undefined) {
            latestReasoningRaw = chunk.additional_kwargs['reasoning']
          }
        }

        const finalContent = contentParts.join('')
        const response = new AIMessage(finalContent, finalKwargs)

        const parsed = v.safeParse(reasoningSchema, latestReasoningRaw)
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
