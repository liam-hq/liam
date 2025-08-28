import type { WorkflowState } from '../../chat/workflow/types'

export function isQACompleted(state: WorkflowState): boolean {
  return !!(state.generatedTestcases && state.generatedTestcases.length > 0)
}
