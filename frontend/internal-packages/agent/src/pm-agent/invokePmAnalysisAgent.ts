import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { WorkflowConfigurable } from '../chat/workflow/types'
import { reasoningSchema } from '../langchain/utils/schema'
import type { Reasoning } from '../langchain/utils/types'
import { removeReasoningFromMessages } from '../utils/messageCleanup'
import { PM_ANALYSIS_SYSTEM_MESSAGE } from './prompts/pmAnalysisPrompts'
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
  messages: BaseMessage[],
  configurable: WorkflowConfigurable,
): ResultAsync<AnalysisWithReasoning, Error> => {
  const cleanedMessages = removeReasoningFromMessages(messages)

  const allMessages: BaseMessage[] = [
    new SystemMessage(PM_ANALYSIS_SYSTEM_MESSAGE),
    ...cleanedMessages,
  ]

  const model = new ChatOpenAI({
    model: 'gpt-5',
    reasoning: { effort: 'high', summary: 'detailed' },
    useResponsesApi: true,
  }).bindTools(
    [{ type: 'web_search_preview' }, saveRequirementsToArtifactTool],
    {
      parallel_tool_calls: false,
      tool_choice: 'required',
      strict: true,
    },
  )

  return ResultAsync.fromPromise(
    model.invoke(allMessages, { configurable }),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  ).andThen((response) => {
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
