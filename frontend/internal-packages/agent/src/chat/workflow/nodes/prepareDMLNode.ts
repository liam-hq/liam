import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

/**
 * Prepare DML Node - QA Agent generates DML
 * Performed by qaAgent
 */
export async function prepareDMLNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  if (state.onNodeProgress) {
    await state.onNodeProgress(
      'prepareDML',
      getWorkflowNodeProgress('prepareDML'),
    )
  }

  return {
    ...state,
  }
}
