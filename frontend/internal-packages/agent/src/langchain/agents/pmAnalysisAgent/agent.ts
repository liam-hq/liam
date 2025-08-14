import {
  type AIMessage,
  type BaseMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ok, ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import type { WorkflowConfigurable } from '../../../chat/workflow/types'
import { saveRequirementsToArtifactTool } from '../../../pm-agent/tools/saveRequirementsToArtifactTool'
import { removeReasoningFromMessages } from '../../../utils/messageCleanup'
import { reasoningSchema } from '../../utils/schema'
import type { Reasoning } from '../../utils/types'
import { PM_ANALYSIS_SYSTEM_MESSAGE } from './prompts'

type AnalysisWithReasoning = {
  response: AIMessage
  reasoning: Reasoning | null
}

export class PMAnalysisAgent {
  generate(
    messages: BaseMessage[],
    configurable: WorkflowConfigurable,
  ): ResultAsync<AnalysisWithReasoning, Error> {
    // Remove reasoning field from AIMessages to avoid API issues
    // This prevents the "reasoning without required following item" error
    const cleanedMessages = removeReasoningFromMessages(messages)

    const allMessages: BaseMessage[] = [
      new SystemMessage(PM_ANALYSIS_SYSTEM_MESSAGE),
      ...cleanedMessages,
    ]

    // Single model call with reasoning enabled
    const model = new ChatOpenAI({
      model: 'gpt-5',
      reasoning: { effort: 'high', summary: 'detailed' },
      useResponsesApi: true,
    }).bindTools(
      [{ type: 'web_search_preview' }, saveRequirementsToArtifactTool],
      {
        parallel_tool_calls: false,
      },
    )

    // Single invocation - model will use web search if needed and provide analysis
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
}
