import type { WorkflowState } from '../../types'

export function isQACompleted(state: WorkflowState): boolean {
  const testcaseCount = Object.values(state.analyzedRequirements.testcases)
    .flat()
    .filter((tc) => tc.sql && tc.sql.trim() !== '').length
  return testcaseCount > 0
}
