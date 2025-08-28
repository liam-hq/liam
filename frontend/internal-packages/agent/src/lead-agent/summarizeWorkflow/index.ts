import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import {
  AIMessage,
  AIMessageChunk,
  SystemMessage,
} from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import type { WorkflowState } from '../../chat/workflow/types'

/**
 * Summarizes the workflow by generating a summary of what was accomplished
 * This node is responsible for creating a concise summary of the database design session
 */
export async function summarizeWorkflow(
  state: WorkflowState,
): Promise<Partial<WorkflowState>> {
  const summaryResult = await generateWorkflowSummary(state)

  return summaryResult.match(
    (summaryMessage) => ({
      messages: [summaryMessage],
      next: END,
    }),
    (error) => {
      throw error
    },
  )
}

/**
 * Generates a summary of the workflow conversation using LLM
 * Focuses on database design decisions and outcomes
 */
function generateWorkflowSummary(
  state: WorkflowState,
): ResultAsync<AIMessage, Error> {
  const llm = new ChatOpenAI({
    model: 'gpt-5-nano',
    reasoning: { effort: 'minimal' },
  })

  const summaryPrompt = `Based on the following workflow conversation about database design, provide a concise summary of what was accomplished:

Please summarize:
- The main user requirements that were analyzed
- Key database design decisions that were made
- Any schemas, tables, or data structures that were created or modified
- Important outcomes or results from this workflow

Keep the summary informative but concise, focusing on the key achievements and decisions made during this database design session.`

  const invoke = ResultAsync.fromThrowable(
    () => {
      return llm.stream([new SystemMessage(summaryPrompt), ...state.messages])
    },
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return invoke().andThen((stream) => {
    return ResultAsync.fromPromise(
      (async () => {
        // OpenAI ("chatcmpl-...") and LangGraph ("run-...") use different id formats,
        // so we overwrite with a UUID to unify chunk ids for consistent handling.
        const id = crypto.randomUUID()
        let accumulatedChunk: AIMessageChunk | null = null

        for await (const _chunk of stream) {
          const chunk = new AIMessageChunk({ ..._chunk, id, name: 'lead' })
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
            })
          : new AIMessage('')

        return response
      })(),
      (error) => (error instanceof Error ? error : new Error(String(error))),
    )
  })
}
