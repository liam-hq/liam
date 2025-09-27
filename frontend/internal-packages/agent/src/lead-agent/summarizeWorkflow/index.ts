import {
  type AIMessage,
  type AIMessageChunk,
  SystemMessage,
} from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import type { ResultAsync } from 'neverthrow'
import { SSE_EVENTS } from '../../streaming/constants'
import type { WorkflowState } from '../../types'
import { streamLLMResponse } from '../../utils/streamingLlmUtils'

const AGENT_NAME = 'lead' as const

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
    maxCompletionTokens: 2_000,
  })

  const summaryPrompt = `Based on the following workflow conversation about database design, provide a concise summary of what was accomplished:

Please summarize:
- The main user requirements that were analyzed
- Key database design decisions that were made
- Any schemas, tables, or data structures that were created or modified
- Important outcomes or results from this workflow

Keep the summary informative but concise, focusing on the key achievements and decisions made during this database design session.`

  const stream = fromAsyncThrowable(() =>
    llm.stream([new SystemMessage(summaryPrompt), ...state.messages]),
  )

  const response = fromAsyncThrowable((stream: AsyncIterable<AIMessageChunk>) =>
    streamLLMResponse(stream, {
      agentName: AGENT_NAME,
      eventType: SSE_EVENTS.MESSAGES,
    }),
  )

  return stream().andThen(response)
}
