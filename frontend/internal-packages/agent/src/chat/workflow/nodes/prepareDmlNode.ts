import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

/**
 * Prepare DML Node - QA Agent generates DML
 * Performed by qaAgent
 */
export async function prepareDmlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: prepareDML',
        progress: getWorkflowNodeProgress('prepareDML'),
      },
    )
  }

  return {
    ...state,
  }
}
