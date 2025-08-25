import { type AIMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { LeadAgentState } from '../annotation'

/**
 * Summarizes the workflow by generating a summary of what was accomplished
 * This node is responsible for creating a concise summary of the database design session
 */
export async function summarizeWorkflow(
  state: LeadAgentState,
  config: RunnableConfig,
): Promise<Partial<LeadAgentState>> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'summarizeWorkflow',
    )
  }

  const summaryResult = await generateWorkflowSummary(state)

  return summaryResult.match(
    (summaryMessage) => ({
      messages: [summaryMessage],
      next: END,
    }),
    (error) => {
      throw new WorkflowTerminationError(error, 'summarizeWorkflow')
    },
  )
}

/**
 * Generates a summary of the workflow conversation using LLM
 * Focuses on database design decisions and outcomes
 */
function generateWorkflowSummary(
  state: LeadAgentState,
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

  return ResultAsync.fromPromise(
    llm.invoke([new SystemMessage(summaryPrompt), ...state.messages]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )
}
