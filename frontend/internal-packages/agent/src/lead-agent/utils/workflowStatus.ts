import type { WorkflowState } from '../../types'

export function isQACompleted(state: WorkflowState): boolean {
  return state.testcases.length > 0
}
