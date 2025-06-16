import { executeWorkflow } from './services/workflow'
import type { WorkflowOptions, WorkflowState } from './types'

export const executeChatWorkflow = async (
  initialState: WorkflowState,
  options?: WorkflowOptions,
): Promise<WorkflowState> => {
  const recursionLimit = options?.recursionLimit ?? 10
  return executeWorkflow(initialState, recursionLimit)
}
