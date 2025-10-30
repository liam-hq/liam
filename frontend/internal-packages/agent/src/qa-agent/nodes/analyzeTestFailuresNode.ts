import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const extractFailedTests = (
  analyzedRequirements: AnalyzedRequirements,
): string[] => {
  const failedTestIds: string[] = []

  for (const testcases of Object.values(analyzedRequirements.testcases)) {
    for (const testcase of testcases) {
      if (testcase.testResults.length === 0) continue

      const lastResult = testcase.testResults[testcase.testResults.length - 1]
      if (!lastResult) continue

      const hasFailed = !lastResult.success

      if (hasFailed) {
        failedTestIds.push(testcase.id)
      }
    }
  }

  return failedTestIds
}

/**
 * Analyzes test failures and marks them for retry
 * @param state - QA agent state containing test results
 * @returns Updated state with failureAnalysis, or empty object if no failures
 */
export const analyzeTestFailuresNode = (state: QaAgentState) => {
  const { analyzedRequirements } = state
  const failedTestIds = extractFailedTests(analyzedRequirements)

  return {
    ...(failedTestIds.length > 0 && {
      // TODO: Implement schema vs SQL issue classification
      failureAnalysis: {
        failedSqlTestIds: failedTestIds,
        failedSchemaTestIds: [],
      },
    }),
  }
}
