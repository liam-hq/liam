import type { WorkflowState } from '../../workflow/types'

export function isQACompleted(state: WorkflowState): boolean {
  return state.testcases.length > 0
}
