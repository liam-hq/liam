import type { WorkflowState } from '../../types'

export function isQACompleted(state: WorkflowState): boolean {
  // Check if any testcases have SQL populated
  const testcases = state.analyzedRequirements.testcases

  for (const categoryTestcases of Object.values(testcases)) {
    for (const testcase of categoryTestcases) {
      if (testcase.sql && testcase.sql !== '') {
        return true
      }
    }
  }

  return false
}
