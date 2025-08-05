import type { WorkflowState } from '../types'

export const routeAfterPreAssessment = (
  state: WorkflowState,
): 'analyzeRequirements' | 'finalizeArtifacts' => {
  const result = state.preAssessmentResult

  if (result?.decision === 'sufficient') {
    return 'analyzeRequirements'
  }

  return 'finalizeArtifacts'
}
