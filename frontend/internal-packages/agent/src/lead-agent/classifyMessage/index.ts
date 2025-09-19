import { Command, END } from '@langchain/langgraph'
import type { WorkflowState } from '../../types'
import { isQACompleted, shouldRouteDBAgent } from '../utils/workflowStatus'

export async function classifyMessage(state: WorkflowState): Promise<Command> {
  // 1. Check if DB Agent routing is needed (highest priority)
  if (shouldRouteDBAgent(state)) {
    return new Command({
      update: { next: 'dbAgent' },
      goto: END,
    })
  }

  // 2. Check if QA is completed (second priority)
  if (isQACompleted(state)) {
    return new Command({ goto: 'summarizeWorkflow' })
  }

  // 3. Direct routing to pmAgent (default)
  return new Command({
    update: { next: 'pmAgent' },
    goto: END,
  })
}
