import type { WorkflowState } from '../../chat/workflow/shared/workflowAnnotation'

export function isQACompleted(state: WorkflowState): boolean {
  return !!(state.generatedTestcases && state.generatedTestcases.length > 0)
}
