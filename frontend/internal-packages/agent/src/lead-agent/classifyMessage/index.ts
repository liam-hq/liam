import { Command, END } from '@langchain/langgraph'
import type { WorkflowState } from '../../types'
import { isQACompleted } from '../utils/workflowStatus'

export async function classifyMessage(state: WorkflowState): Promise<Command> {
  // 1. Check if QA is completed first (highest priority)
  if (isQACompleted(state)) {
    return new Command({ goto: 'summarizeWorkflow' })
  }

  // 2. Direct routing to pmAgent
  return new Command({
    update: { next: 'pmAgent' },
    goto: END,
  })
}
